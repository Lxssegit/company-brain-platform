import type { BranchKind, KnowledgeScope, KnowledgeStatus, KnowledgeType, RoleKey } from "@prisma/client";

/**
 * One glossary for the interface, so the same concept is not called three
 * different things across three screens. Domain identifiers stay English in
 * code; only what a user reads is translated here.
 *
 * Branch -> Zweig keeps the product's own tree metaphor intact, which is the
 * reason the hierarchy is shaped the way it is.
 */

export const ROLE_LABEL: Record<RoleKey, string> = {
  SUPER_ADMIN: "Super-Admin",
  COMPANY_ADMIN: "Unternehmens-Admin",
  DEPARTMENT_ADMIN: "Abteilungs-Admin",
  MANAGER: "Teamleitung",
  EMPLOYEE: "Mitarbeitend",
};

export const BRANCH_KIND_LABEL: Record<BranchKind, string> = {
  COMPANY: "Unternehmen",
  DEPARTMENT: "Abteilung",
  TEAM: "Team",
  PERSONAL: "Persönlich",
};

/** "1 Zweig" / "7 Zweige" */
export function branchCount(count: number) {
  return `${count} ${count === 1 ? "Zweig" : "Zweige"}`;
}

export const KNOWLEDGE_TYPE_LABEL: Record<KnowledgeType, string> = {
  FACT: "Fakt",
  PROCESS: "Prozess",
  RULE: "Regel",
  DECISION: "Entscheidung",
  CUSTOMER: "Kunde",
  PRODUCT: "Produkt",
  PERSON: "Person",
  EXCEPTION: "Ausnahme",
  PROCEDURE: "Verfahren",
  LESSON: "Lehre",
  POLICY: "Richtlinie",
};

export const KNOWLEDGE_SCOPE_LABEL: Record<KnowledgeScope, string> = {
  PERSONAL: "Persönlich",
  TEAM: "Team",
  DEPARTMENT: "Abteilung",
  COMPANY: "Unternehmen",
};

export const KNOWLEDGE_STATUS_LABEL: Record<KnowledgeStatus, string> = {
  DRAFT: "Entwurf",
  PENDING_REVIEW: "Wartet auf Freigabe",
  APPROVED: "Freigegeben",
  REJECTED: "Abgelehnt",
  ARCHIVED: "Archiviert",
};

/** How a hit was found, in the reader's words rather than the retriever's. */
export const MATCH_METHOD_LABEL: Record<"lexical" | "vector" | "hybrid", string> = {
  lexical: "Worttreffer",
  vector: "Bedeutungstreffer",
  hybrid: "Wort- und Bedeutungstreffer",
};
