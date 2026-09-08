import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getVisibleBranches } from "@/lib/branches/access";
import { getAIProvider } from "@/lib/ai/provider";
import { buildGroundedContext, contextBranchIds, filterAuthorizedContext, rankKnowledge } from "@/lib/retrieval/context";
import { lexicalScore, retrievalThreshold } from "@/lib/retrieval/scoring";
import type { DecisionCandidate, KnowledgeCandidate, RetrievalSource, RetrievalResult } from "@/lib/retrieval/types";

type RetrievalUser = { id: string; organizationId: string | null; role?: { key: "SUPER_ADMIN" | "COMPANY_ADMIN" | "DEPARTMENT_ADMIN" | "MANAGER" | "EMPLOYEE" } | null };

function sourceFromLink(link: { citation: string | null; source: { id: string; title: string; type: string; externalUrl: string | null } }): RetrievalSource {
  return { id: link.source.id, title: link.source.title, type: link.source.type, externalUrl: link.source.externalUrl, citation: link.citation };
}

function vectorLiteral(values: number[]) {
  if (!values.length || values.some((value) => !Number.isFinite(value))) throw new Error("Invalid embedding");
  return `[${values.join(",")}]`;
}

async function vectorScores(organizationId: string, userId: string, branchIds: string[], embedding: number[]) {
  if (!branchIds.length) return new Map<string, number>();
  try {
    const literal = vectorLiteral(embedding);
    const rows = await prisma.$queryRaw<Array<{ id: string; score: number }>>(Prisma.sql`SELECT ku.id, (1 - (ku.embedding <=> ${literal}::vector))::float8 AS score FROM "KnowledgeUnit" ku WHERE ku."organizationId" = ${organizationId} AND ku."branchId" IN (${Prisma.join(branchIds)}) AND ku."embedding" IS NOT NULL AND ((ku."status" = 'APPROVED' AND ku."scope" <> 'PERSONAL') OR (ku."scope" = 'PERSONAL' AND ku."createdById" = ${userId})) ORDER BY ku."embedding" <=> ${literal}::vector LIMIT 24`);
    return new Map(rows.map((row) => [row.id, Math.max(0, Math.min(1, Number(row.score)))]));
  } catch {
    return new Map<string, number>();
  }
}

export async function retrieveAuthorizedContext(user: RetrievalUser, query: string, options: { branchId?: string; limit?: number } = {}): Promise<RetrievalResult> {
  if (!user.organizationId) return buildGroundedContext({ authorizedBranchIds: [], knowledge: [], decisions: [] });
  const visibleBranches = await getVisibleBranches(user);
  const branchIds = contextBranchIds(visibleBranches, options.branchId);
  if (options.branchId && !branchIds.length) return buildGroundedContext({ authorizedBranchIds: [], knowledge: [], decisions: [] });
  const limit = Math.min(20, Math.max(1, options.limit ?? 8));
  const now = new Date();
  const rawKnowledge = await prisma.knowledgeUnit.findMany({ where: { organizationId: user.organizationId, branchId: { in: branchIds }, OR: [{ status: "APPROVED", scope: { not: "PERSONAL" } }, { scope: "PERSONAL", createdById: user.id }], }, include: { branch: { select: { id: true, name: true } }, sources: { include: { source: { select: { id: true, title: true, type: true, externalUrl: true } } } } }, take: 100 });
  const provider = process.env.OPENAI_API_KEY?.trim() ? getAIProvider() : null;
  let vectorMap = new Map<string, number>();
  if (provider) {
    try { vectorMap = await vectorScores(user.organizationId, user.id, branchIds, await provider.generateEmbedding(query)); } catch { vectorMap = new Map<string, number>(); }
  }
  const rankedKnowledge = rankKnowledge(query, rawKnowledge);
  const threshold = retrievalThreshold();
  const knowledge: KnowledgeCandidate[] = rankedKnowledge.map(({ item: ranked, score }) => {
    const item = ranked;
    const vectorScore = vectorMap.get(item.id) ?? 0;
    const finalScore = Math.max(score, vectorScore);
    const matchMethod: KnowledgeCandidate["matchMethod"] = vectorScore > score ? "vector" : vectorScore > 0 ? "hybrid" : "lexical";
    return { id: item.id, organizationId: item.organizationId, branchId: item.branchId, branchName: item.branch.name, type: item.type, title: item.title, content: item.content, scope: item.scope, status: item.status, createdById: item.createdById, confidence: item.confidence, sources: item.sources.map(sourceFromLink), score: finalScore, matchMethod };
  }).filter((item) => item.score >= threshold).sort((a, b) => b.score - a.score).slice(0, limit);
  const rawDecisions = await prisma.decision.findMany({ where: { organizationId: user.organizationId, status: "ACTIVE", validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gt: now } }], affectedBranches: { some: { branchId: { in: branchIds } } } }, include: { affectedBranches: { include: { branch: { select: { id: true, name: true } } } }, sources: { include: { source: { select: { id: true, title: true, type: true, externalUrl: true } } } } }, take: 100, orderBy: { validFrom: "desc" } });
  const decisions: DecisionCandidate[] = rawDecisions.map((item) => {
    const visibleLinks = item.affectedBranches.filter((link) => branchIds.includes(link.branchId));
    return { id: item.id, organizationId: item.organizationId, title: item.title, description: item.description, reason: item.reason, department: item.department, status: item.status, validFrom: item.validFrom, validUntil: item.validUntil, exceptions: item.exceptions, branchIds: visibleLinks.map((link) => link.branchId), branchNames: visibleLinks.map((link) => link.branch.name), sources: item.sources.map(sourceFromLink), score: lexicalScore(query, item.title, `${item.description} ${item.reason} ${item.department ?? ""}`) };
  }).filter((item) => item.score >= threshold || !query.trim()).sort((a, b) => b.score - a.score).slice(0, limit);
  const authorized = filterAuthorizedContext({ organizationId: user.organizationId, userId: user.id, allowedBranchIds: branchIds, knowledge, decisions });
  return buildGroundedContext({ authorizedBranchIds: branchIds, ...authorized });
}
