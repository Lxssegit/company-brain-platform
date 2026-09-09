import { beforeEach, describe, expect, it, vi } from "vitest";
import { canManageKnowledge } from "@/lib/knowledge/access";

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
  it("always lets the author manage their own unit", () => {
    expect(canManageKnowledge(employee, "me", "EDIT")).toBe(true);
    expect(canManageKnowledge(employee, "me", "DELETE")).toBe(true);
  });

  it("separates EDIT from DELETE instead of answering both the same", () => {
    expect(canManageKnowledge(manager, "someone-else", "EDIT")).toBe(true);
    expect(canManageKnowledge(manager, "someone-else", "DELETE")).toBe(false);
    expect(canManageKnowledge(admin, "someone-else", "DELETE")).toBe(true);
  });

  it("gives an employee no authority over another author's unit", () => {
    expect(canManageKnowledge(employee, "someone-else", "EDIT")).toBe(false);
    expect(canManageKnowledge(employee, "someone-else", "DELETE")).toBe(false);
  });

  it("refuses when the account carries no role at all", () => {
    expect(canManageKnowledge({ id: "me", role: null }, "someone-else", "EDIT")).toBe(false);
  });
});
