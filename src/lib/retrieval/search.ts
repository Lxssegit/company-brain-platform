import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getVisibleBranches } from "@/lib/branches/access";
import { getAIProvider } from "@/lib/ai/provider";
import { buildGroundedContext, contextBranchIds, filterAuthorizedContext } from "@/lib/retrieval/context";
import { lexicalMatches, lexicalScore, relevanceFloor, tokenize } from "@/lib/retrieval/scoring";
import type { DecisionCandidate, KnowledgeCandidate, RetrievalSource, RetrievalResult } from "@/lib/retrieval/types";

type RetrievalUser = { id: string; organizationId: string | null; role?: { key: "SUPER_ADMIN" | "COMPANY_ADMIN" | "DEPARTMENT_ADMIN" | "MANAGER" | "EMPLOYEE" } | null };

/** How many rows each candidate source may contribute before ranking. */
const VECTOR_CANDIDATES = 24;
const LEXICAL_CANDIDATES = 60;
const FALLBACK_CANDIDATES = 60;

function sourceFromLink(link: { citation: string | null; source: { id: string; title: string; type: string; externalUrl: string | null } }): RetrievalSource {
  return { id: link.source.id, title: link.source.title, type: link.source.type, externalUrl: link.source.externalUrl, citation: link.citation };
}

function vectorLiteral(values: number[]) {
  if (!values.length || values.some((value) => !Number.isFinite(value))) throw new Error("Invalid embedding");
  return `[${values.join(",")}]`;
}

/** The same predicate the Prisma queries use, expressed for raw SQL. */
function readableSql(organizationId: string, userId: string, branchIds: string[]) {
  return Prisma.sql`ku."organizationId" = ${organizationId} AND ku."branchId" IN (${Prisma.join(branchIds)}) AND ((ku."status" = 'APPROVED' AND ku."scope" <> 'PERSONAL') OR (ku."scope" = 'PERSONAL' AND ku."createdById" = ${userId}))`;
}

async function vectorCandidates(organizationId: string, userId: string, branchIds: string[], embedding: number[]) {
  const literal = vectorLiteral(embedding);
  const rows = await prisma.$queryRaw<Array<{ id: string; score: number }>>(Prisma.sql`
    SELECT ku.id, (1 - (ku.embedding <=> ${literal}::vector))::float8 AS score
    FROM "KnowledgeUnit" ku
    WHERE ${readableSql(organizationId, userId, branchIds)} AND ku."embedding" IS NOT NULL
    ORDER BY ku."embedding" <=> ${literal}::vector
    LIMIT ${VECTOR_CANDIDATES}`);
  return new Map(rows.map((row) => [row.id, Math.max(0, Math.min(1, Number(row.score)))]));
}

/**
 * Candidate selection happens in the database, ranked, under the same
 * permission predicate. An earlier version pulled an arbitrary unordered 100
 * rows and ranked those in JavaScript, which meant that past 100 units the
 * result was a sample, and that a vector hit outside the sample was computed
 * and then silently discarded.
 */
async function lexicalCandidateIds(organizationId: string, userId: string, branchIds: string[], query: string) {
  /* plainto_tsquery joins every term with AND, so one incidental word in a
     natural question ("Wie genau laeuft ... ab") was enough to match nothing at
     all. The terms are OR-ed and ts_rank decides how much coverage is worth.
     tokenize already strips everything that is not a letter or digit, so the
     terms cannot carry tsquery syntax. */
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return [];
  const tsquery = terms.join(" | ");
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT ku.id
    FROM "KnowledgeUnit" ku
    WHERE ${readableSql(organizationId, userId, branchIds)}
      AND to_tsvector('german', ku."title" || ' ' || ku."content") @@ to_tsquery('german', ${tsquery})
    ORDER BY ts_rank(to_tsvector('german', ku."title" || ' ' || ku."content"), to_tsquery('german', ${tsquery})) DESC
    LIMIT ${LEXICAL_CANDIDATES}`);
  return rows.map((row) => row.id);
}

export type RetrievalDiagnostics = { vectorSearch: "used" | "unavailable" | "not_configured"; candidateSource: "hybrid" | "lexical" | "recent" };

export async function retrieveAuthorizedContext(user: RetrievalUser, query: string, options: { branchId?: string; limit?: number } = {}): Promise<RetrievalResult> {
  if (!user.organizationId) return buildGroundedContext({ authorizedBranchIds: [], knowledge: [], decisions: [] });
  const organizationId = user.organizationId;
  const visibleBranches = await getVisibleBranches(user);
  const branchIds = contextBranchIds(visibleBranches, options.branchId);
  if (!branchIds.length) return buildGroundedContext({ authorizedBranchIds: [], knowledge: [], decisions: [] });
  const limit = Math.min(20, Math.max(1, options.limit ?? 8));
  const now = new Date();

  const provider = process.env.OPENAI_API_KEY?.trim() ? getAIProvider() : null;
  let vectorMap = new Map<string, number>();
  let vectorSearch: RetrievalDiagnostics["vectorSearch"] = provider ? "used" : "not_configured";
  if (provider) {
    try {
      vectorMap = await vectorCandidates(organizationId, user.id, branchIds, await provider.generateEmbedding(query));
    } catch (error) {
      /* Swallowing this silently made a missing pgvector extension or a broken
         embedding look like "nothing matched" forever. */
      vectorSearch = "unavailable";
      console.warn("[retrieval] vector search unavailable, falling back to lexical:", error instanceof Error ? error.message : error);
    }
  }

  let lexicalIds: string[] = [];
  try {
    lexicalIds = await lexicalCandidateIds(organizationId, user.id, branchIds, query);
  } catch (error) {
    console.warn("[retrieval] full-text candidate query failed:", error instanceof Error ? error.message : error);
  }

  const candidateIds = [...new Set([...vectorMap.keys(), ...lexicalIds])];
  const include = { branch: { select: { id: true, name: true } }, sources: { include: { source: { select: { id: true, title: true, type: true, externalUrl: true } } } } } as const;
  const readable = { organizationId, branchId: { in: branchIds }, OR: [{ status: "APPROVED" as const, scope: { not: "PERSONAL" as const } }, { scope: "PERSONAL" as const, createdById: user.id }] };

  const rawKnowledge = candidateIds.length
    ? await prisma.knowledgeUnit.findMany({ where: { AND: [readable, { id: { in: candidateIds } }] }, include })
    /* Nothing matched the index. Fall back to a bounded, ordered window rather
       than to an arbitrary one, so the result is at least explainable. */
    : await prisma.knowledgeUnit.findMany({ where: readable, include, orderBy: { updatedAt: "desc" }, take: FALLBACK_CANDIDATES });

  const scored = rawKnowledge.map((item) => {
    const vectorScore = vectorMap.get(item.id) ?? 0;
    const matches = lexicalMatches(query, item.title, item.content);
    const score = Math.max(lexicalScore(query, item.title, item.content), vectorScore);
    const matchMethod: KnowledgeCandidate["matchMethod"] = vectorScore > 0 && matches > 0 ? "hybrid" : vectorScore > 0 ? "vector" : "lexical";
    return { item, score, matches, vectorScore, matchMethod };
  }).filter((candidate) => candidate.matches > 0 || candidate.vectorScore > 0);

  const knowledgeFloor = relevanceFloor(scored.map((candidate) => candidate.score));
  const knowledge: KnowledgeCandidate[] = scored
    .filter((candidate) => candidate.score >= knowledgeFloor)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item, score, matchMethod }) => ({ id: item.id, organizationId: item.organizationId, branchId: item.branchId, branchName: item.branch.name, type: item.type, title: item.title, content: item.content, scope: item.scope, status: item.status, createdById: item.createdById, confidence: item.confidence, sources: item.sources.map(sourceFromLink), score, matchMethod }));

  const rawDecisions = await prisma.decision.findMany({
    where: { organizationId, status: "ACTIVE", validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gt: now } }], affectedBranches: { some: { branchId: { in: branchIds } } } },
    include: { affectedBranches: { include: { branch: { select: { id: true, name: true } } } }, sources: { include: { source: { select: { id: true, title: true, type: true, externalUrl: true } } } } },
    orderBy: { validFrom: "desc" },
    take: 100,
  });
  const scoredDecisions = rawDecisions.map((item) => {
    const haystack = `${item.description} ${item.reason} ${item.department ?? ""}`;
    return { item, score: lexicalScore(query, item.title, haystack), matches: lexicalMatches(query, item.title, haystack) };
  }).filter((candidate) => candidate.matches > 0);
  const decisionFloor = relevanceFloor(scoredDecisions.map((candidate) => candidate.score));
  const decisions: DecisionCandidate[] = scoredDecisions
    .filter((candidate) => candidate.score >= decisionFloor)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item, score }) => {
      const visibleLinks = item.affectedBranches.filter((link) => branchIds.includes(link.branchId));
      return { id: item.id, organizationId: item.organizationId, title: item.title, description: item.description, reason: item.reason, department: item.department, status: item.status, validFrom: item.validFrom, validUntil: item.validUntil, exceptions: item.exceptions, branchIds: visibleLinks.map((link) => link.branchId), branchNames: visibleLinks.map((link) => link.branch.name), sources: item.sources.map(sourceFromLink), score };
    });

  const authorized = filterAuthorizedContext({ organizationId, userId: user.id, allowedBranchIds: branchIds, knowledge, decisions });
  const diagnostics: RetrievalDiagnostics = { vectorSearch, candidateSource: candidateIds.length ? (vectorMap.size ? "hybrid" : "lexical") : "recent" };
  return { ...buildGroundedContext({ authorizedBranchIds: branchIds, ...authorized }), diagnostics };
}
