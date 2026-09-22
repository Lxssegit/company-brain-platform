import { describe, expect, it } from "vitest";
import { editNeedsReapproval } from "@/lib/knowledge/access";

/**
 * The approval on a shared unit is a record that somebody accountable read that
 * exact text. Editing it in place would leave the record standing over words
 * nobody agreed to — approve something benign, then rewrite it.
 */
describe("editNeedsReapproval", () => {
  it("sends an employee's edit of approved shared knowledge back to the queue", () => {
    expect(editNeedsReapproval({ status: "APPROVED", scope: "TEAM" }, "EMPLOYEE")).toBe(true);
    expect(editNeedsReapproval({ status: "APPROVED", scope: "DEPARTMENT" }, "MANAGER")).toBe(true);
    expect(editNeedsReapproval({ status: "APPROVED", scope: "COMPANY" }, "EMPLOYEE")).toBe(true);
  });

  it("does not ask someone who may publish without review to approve their own edit", () => {
    expect(editNeedsReapproval({ status: "APPROVED", scope: "COMPANY" }, "COMPANY_ADMIN")).toBe(false);
    expect(editNeedsReapproval({ status: "APPROVED", scope: "TEAM" }, "DEPARTMENT_ADMIN")).toBe(false);
    expect(editNeedsReapproval({ status: "APPROVED", scope: "TEAM" }, "SUPER_ADMIN")).toBe(false);
  });

  it("leaves personal knowledge alone, because nobody else can see it", () => {
    expect(editNeedsReapproval({ status: "APPROVED", scope: "PERSONAL" }, "EMPLOYEE")).toBe(false);
  });

  it("does not re-queue what is not approved yet", () => {
    expect(editNeedsReapproval({ status: "PENDING_REVIEW", scope: "TEAM" }, "EMPLOYEE")).toBe(false);
    expect(editNeedsReapproval({ status: "DRAFT", scope: "TEAM" }, "EMPLOYEE")).toBe(false);
    expect(editNeedsReapproval({ status: "REJECTED", scope: "TEAM" }, "EMPLOYEE")).toBe(false);
  });

  it("treats a missing role as unable to publish without review", () => {
    expect(editNeedsReapproval({ status: "APPROVED", scope: "TEAM" }, null)).toBe(true);
  });
});

import { canManageKnowledge } from "@/lib/knowledge/access";
import { hasRolePermission } from "@/lib/permissions/policy";

/**
 * canManageKnowledge has always answered "yes" for the author of a unit, but
 * the route checks the role permission first — and EMPLOYEE did not carry EDIT,
 * so that branch was unreachable for exactly the people it was written for. An
 * employee could not correct their own note, not even one in their personal
 * branch that nobody else can see or repair.
 */
describe("an author may correct their own work", () => {
  const employee = { id: "u1", role: { key: "EMPLOYEE" as const } };

  it("gives EMPLOYEE the permission the route demands", () => {
    expect(hasRolePermission("EMPLOYEE", "EDIT")).toBe(true);
  });

  it("still limits them to what they wrote", () => {
    expect(canManageKnowledge(employee, "u1", "EDIT")).toBe(true);
    expect(canManageKnowledge(employee, "someone-else", "EDIT")).toBe(false);
  });

  it("keeps the rest of the matrix where it was", () => {
    expect(hasRolePermission("EMPLOYEE", "APPROVE")).toBe(false);
    expect(hasRolePermission("EMPLOYEE", "MANAGE_USERS")).toBe(false);
    expect(hasRolePermission("EMPLOYEE", "MANAGE_BRANCH")).toBe(false);
    expect(hasRolePermission("EMPLOYEE", "MANAGE_DECISIONS")).toBe(false);
  });
});

/**
 * The author shortcut used to run before the permission argument was read, so
 * this function answered "yes" for an employee archiving their own entry while
 * the route behind it refused. The page rendered a button that could only fail.
 */
describe("canManageKnowledge respects the permission it is asked about", () => {
  const employee = { id: "u1", role: { key: "EMPLOYEE" as const } };
  const manager = { id: "u2", role: { key: "MANAGER" as const } };
  const admin = { id: "u3", role: { key: "COMPANY_ADMIN" as const } };

  it("allows an author who carries the permission", () => {
    expect(canManageKnowledge(employee, "u1")).toBe(true);
    expect(canManageKnowledge(admin, "u3")).toBe(true);
  });

  it("keeps the reviewer path for other people's work", () => {
    expect(canManageKnowledge(manager, "someone")).toBe(true);
    expect(canManageKnowledge(employee, "someone")).toBe(false);
    expect(canManageKnowledge(admin, "someone")).toBe(true);
  });

  it("refuses an account with no role at all", () => {
    expect(canManageKnowledge({ id: "u4", role: null }, "u4")).toBe(false);
  });
});

import { canArchiveKnowledge } from "@/lib/knowledge/access";

/**
 * Archiving has no counterpart to review: nothing brings an entry back on
 * somebody else's say-so. An author may therefore take back only what is still
 * theirs alone.
 */
describe("canArchiveKnowledge", () => {
  const employee = { id: "u1", role: { key: "EMPLOYEE" as const } };
  const admin = { id: "u9", role: { key: "COMPANY_ADMIN" as const } };
  const manager = { id: "u2", role: { key: "MANAGER" as const } };

  it("lets an author clean up their own personal note", () => {
    expect(canArchiveKnowledge(employee, { createdById: "u1", status: "APPROVED", scope: "PERSONAL" })).toBe(true);
  });

  it("lets an author withdraw their own work before anyone agreed to it", () => {
    expect(canArchiveKnowledge(employee, { createdById: "u1", status: "PENDING_REVIEW", scope: "TEAM" })).toBe(true);
    expect(canArchiveKnowledge(employee, { createdById: "u1", status: "REJECTED", scope: "TEAM" })).toBe(true);
    expect(canArchiveKnowledge(employee, { createdById: "u1", status: "DRAFT", scope: "COMPANY" })).toBe(true);
  });

  it("refuses an author removing knowledge the company agreed to", () => {
    expect(canArchiveKnowledge(employee, { createdById: "u1", status: "APPROVED", scope: "TEAM" })).toBe(false);
    expect(canArchiveKnowledge(employee, { createdById: "u1", status: "APPROVED", scope: "COMPANY" })).toBe(false);
  });

  it("refuses anyone touching somebody else's work without an elevated role", () => {
    expect(canArchiveKnowledge(employee, { createdById: "other", status: "DRAFT", scope: "PERSONAL" })).toBe(false);
    expect(canArchiveKnowledge(manager, { createdById: "other", status: "DRAFT", scope: "TEAM" })).toBe(false);
  });

  it("still lets an elevated role archive agreed knowledge", () => {
    expect(canArchiveKnowledge(admin, { createdById: "other", status: "APPROVED", scope: "COMPANY" })).toBe(true);
  });
});
