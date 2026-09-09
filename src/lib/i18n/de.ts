import type { BranchKind, RoleKey } from "@prisma/client";

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
