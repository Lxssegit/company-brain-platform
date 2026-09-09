import { describe, expect, it, vi } from "vitest";
import { canArchiveKnowledge, canManageKnowledge } from "@/lib/knowledge/access";

/* getVisibleBranches talks to PostgreSQL; the predicate it feeds is what these
   tests are about, so the branch lookup is stubbed and the shape is asserted. */
vi.mock("@/lib/branches/access", () => ({
  getVisibleBranches: vi.fn(async () => [{ id: "branch-a" }, { id: "branch-b" }]),
}));

const { visibleKnowledgeWhere } = await import("@/lib/knowledge/access");

const employee = { id: "me", organizationId: "org-a", role: { key: "EMPLOYEE" as const } };
const manager = { id: "me", organizationId: "org-a", role: { key: "MANAGER" as const } };
const admin = { id: "me", organizationId: "org-a", role: { key: "COMPANY_ADMIN" as const } };

describe("knowledge visibility predicate", () => {
  it("scopes every query to the organization and the visible branches", async () => {
    const where = await visibleKnowledgeWhere(employee);
    expect(where?.organizationId).toBe("org-a");
    expect(where?.branchId).toEqual({ in: ["branch-a", "branch-b"] });
  });

  it("refuses a branch the user cannot see instead of widening the query", async () => {
    expect(await visibleKnowledgeWhere(employee, "branch-elsewhere")).toBeNull();
  });

  it("never exposes another user's personal knowledge", async () => {
    const where = await visibleKnowledgeWhere(employee);
    const shared = where?.OR?.find((clause) => "status" in clause && clause.status === "APPROVED");
    expect(shared).toMatchObject({ scope: { not: "PERSONAL" } });
    expect(where?.OR).toContainEqual({ createdById: "me" });
  });

  it("lets an approver read pending units, because they are asked to approve them", async () => {
    const where = await visibleKnowledgeWhere(manager);
    expect(where?.OR).toContainEqual({ status: "PENDING_REVIEW", scope: { not: "PERSONAL" } });
  });

  it("does not let a plain employee read pending units", async () => {
    const where = await visibleKnowledgeWhere(employee);
    expect(where?.OR?.some((clause) => "status" in clause && clause.status === "PENDING_REVIEW")).toBe(false);
  });
});

describe("who may change somebody else's knowledge", () => {
  it("lets the author edit their own unit", () => {
    expect(canManageKnowledge(employee, "me")).toBe(true);
  });

  /* Archiving used to be answered here too, by a shortcut that returned true
     for the author before reading the permission it was asked about. It has its
     own rule now, in canArchiveKnowledge, because the answer depends on the
     unit's state and not only on who wrote it. */

  it("separates editing from archiving instead of answering both the same", () => {
    expect(canManageKnowledge(manager, "someone-else")).toBe(true);
    expect(canArchiveKnowledge(manager, { createdById: "someone-else", status: "APPROVED", scope: "TEAM" })).toBe(false);
    expect(canArchiveKnowledge(admin, { createdById: "someone-else", status: "APPROVED", scope: "TEAM" })).toBe(true);
  });

  it("gives an employee no authority over another author's unit", () => {
    expect(canManageKnowledge(employee, "someone-else")).toBe(false);
    expect(canArchiveKnowledge(employee, { createdById: "someone-else", status: "DRAFT", scope: "TEAM" })).toBe(false);
  });

  it("refuses when the account carries no role at all", () => {
    expect(canManageKnowledge({ id: "me", role: null }, "someone-else")).toBe(false);
  });
});

import { resolveAdministrableBranchIds, resolveVisibleBranchIds } from "@/lib/branches/tree";

/* Company -> Technical -> Service, plus a sibling department. */
const tree = [
  { id: "company", parentId: null, path: "company", depth: 0 },
  { id: "technical", parentId: "company", path: "company/technical", depth: 1 },
  { id: "service", parentId: "technical", path: "company/technical/service", depth: 2 },
  { id: "finance", parentId: "company", path: "company/finance", depth: 1 },
];

describe("reading inherits upward, administering does not", () => {
  const teamGrant = [{ branchId: "service", access: "READ" as const }];

  it("still lets a team member read the context above them", () => {
    const visible = resolveVisibleBranchIds(tree, teamGrant);
    expect([...visible].sort()).toEqual(["company", "service", "technical"]);
  });

  it("does not let that same grant administer anything above the team", () => {
    const administrable = resolveAdministrableBranchIds(tree, teamGrant);
    expect([...administrable]).toEqual(["service"]);
    expect(administrable.has("technical")).toBe(false);
    expect(administrable.has("company")).toBe(false);
  });

  it("lets a department grant administer the teams nested under it", () => {
    const administrable = resolveAdministrableBranchIds(tree, [{ branchId: "technical", access: "READ" }]);
    expect([...administrable].sort()).toEqual(["service", "technical"]);
    expect(administrable.has("company")).toBe(false);
    expect(administrable.has("finance")).toBe(false);
  });

  it("lets an explicit deny beat an inherited administration grant", () => {
    const administrable = resolveAdministrableBranchIds(tree, [
      { branchId: "company", access: "READ" },
      { branchId: "technical", access: "DENY" },
    ]);
    expect(administrable.has("company")).toBe(true);
    expect(administrable.has("finance")).toBe(true);
    expect(administrable.has("technical")).toBe(false);
    expect(administrable.has("service")).toBe(false);
  });

  it("gives an elevated role the whole organization", () => {
    expect(resolveAdministrableBranchIds(tree, [], true).size).toBe(4);
  });
});
