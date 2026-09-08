import type { DecisionCandidate, DecisionConflict, KnowledgeCandidate, RetrievalResult, RetrievalSource } from "@/lib/retrieval/types";
import { lexicalScore, tokenize } from "@/lib/retrieval/scoring";

export const UNKNOWN_ANSWER = "I don't have enough verified company knowledge to answer this.";

export function contextBranchIds(branches: Array<{ id: string; path: string }>, selectedBranchId?: string) {
  if (!selectedBranchId) return branches.map((branch) => branch.id);
  const selected = branches.find((branch) => branch.id === selectedBranchId);
  if (!selected) return [];
  return branches.filter((branch) => selected.path === branch.path || selected.path.startsWith(`${branch.path}/`)).map((branch) => branch.id);
}

export function filterAuthorizedContext(input: { organizationId: string; userId: string; allowedBranchIds: string[]; knowledge: KnowledgeCandidate[]; decisions: DecisionCandidate[] }) {
  const allowed = new Set(input.allowedBranchIds);
  const knowledge = input.knowledge.filter((item) => item.organizationId === input.organizationId && allowed.has(item.branchId) && (item.scope === "PERSONAL" ? item.createdById === input.userId : item.status === "APPROVED"));
  const decisions = input.decisions.filter((item) => item.organizationId === input.organizationId && item.branchIds.some((branchId) => allowed.has(branchId)) && item.status === "ACTIVE");
  return { knowledge, decisions };
}

export function findDecisionConflicts(decisions: DecisionCandidate[]): DecisionConflict[] {
  const groups = new Map<string, DecisionCandidate[]>();
  for (const decision of decisions) {
    const key = `${(decision.department ?? "company").trim().toLocaleLowerCase("de-DE")}::${tokenize(decision.title).join(" ")}`;
    const group = groups.get(key) ?? [];
    group.push(decision);
    groups.set(key, group);
  }
  return [...groups.entries()].filter(([, group]) => group.length > 1).map(([key, group]) => ({ key, title: group[0].title, decisionIds: group.map((decision) => decision.id), explanation: `Mehrere aktive Entscheidungen betreffen „${group[0].title}“. Bitte den zuständigen Owner klären.` }));
}

function uniqueSources(knowledge: KnowledgeCandidate[], decisions: DecisionCandidate[]) {
  const sources = new Map<string, RetrievalSource>();
  for (const item of [...knowledge, ...decisions]) for (const source of item.sources) sources.set(source.id, source);
  return [...sources.values()];
}

function sourceLabel(source: RetrievalSource) {
  return source.citation ? `${source.title} — ${source.citation}` : source.title;
}

export function buildGroundedContext(input: { authorizedBranchIds: string[]; knowledge: KnowledgeCandidate[]; decisions: DecisionCandidate[]; conflicts?: DecisionConflict[] }): RetrievalResult {
  const conflicts = input.conflicts ?? findDecisionConflicts(input.decisions);
  const citations = uniqueSources(input.knowledge, input.decisions);
  const sections: string[] = [];
  if (input.knowledge.length) sections.push("KNOWLEDGE UNITS\n" + input.knowledge.map((item) => `[K:${item.id}] ${item.title} (${item.type}, Branch: ${item.branchName})\n${item.content}\nSources: ${item.sources.length ? item.sources.map(sourceLabel).join("; ") : "none"}`).join("\n\n"));
  if (input.decisions.length) sections.push("DECISIONS\n" + input.decisions.map((item) => `[D:${item.id}] ${item.title} (${item.department ?? "company"})\nDecision: ${item.description}\nReason: ${item.reason}\nExceptions: ${Array.isArray(item.exceptions) ? item.exceptions.join("; ") : "none"}\nSources: ${item.sources.length ? item.sources.map(sourceLabel).join("; ") : "none"}`).join("\n\n"));
  if (conflicts.length) sections.push("CONFLICTS\n" + conflicts.map((conflict) => `${conflict.explanation} IDs: ${conflict.decisionIds.join(", ")}`).join("\n"));
  return { status: conflicts.length ? "CONFLICT" : sections.length ? "ANSWERABLE" : "UNKNOWN", authorizedBranchIds: input.authorizedBranchIds, knowledge: input.knowledge, decisions: input.decisions, conflicts, citations, promptContext: sections.join("\n\n---\n\n") };
}

export function rankKnowledge<T extends { title: string; content: string }>(query: string, items: T[]) {
  return items.map((item) => ({ item, score: lexicalScore(query, item.title, item.content) })).sort((a, b) => b.score - a.score);
}
