import { describe, expect, it } from "vitest";
import { decidePermission, hasRolePermission } from "@/lib/permissions/policy";
import { resolveVisibleBranchIds } from "@/lib/branches/tree";
import { effectiveDecisionState } from "@/lib/decisions/status";
import { buildGroundedContext, filterAuthorizedContext } from "@/lib/retrieval/context";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateTotpSecret, totpCode, verifyTotp } from "@/lib/auth/totp";

describe("Company Brain permission policy", () => {
  it("allows an employee to read an authorized branch", () => {
    expect(decidePermission({ authenticated: true, organizationMatches: true, role: "EMPLOYEE", permission: "READ", branchAllowed: true })).toEqual({ allowed: true, reason: "allowed" });
  });

  it("denies a user when the branch is outside their allowed context", () => {
    expect(decidePermission({ authenticated: true, organizationMatches: true, role: "EMPLOYEE", permission: "READ", branchAllowed: false })).toEqual({ allowed: false, reason: "branch_denied" });
  });

  it("does not grant employee management permissions", () => {
    expect(hasRolePermission("EMPLOYEE", "MANAGE_USERS")).toBe(false);
    expect(hasRolePermission("COMPANY_ADMIN", "MANAGE_USERS")).toBe(true);
  });

  it("rejects unauthenticated or cross-tenant requests before branch checks", () => {
    expect(decidePermission({ authenticated: false, organizationMatches: false, role: "COMPANY_ADMIN", permission: "READ", branchAllowed: true }).reason).toBe("unauthenticated");
    expect(decidePermission({ authenticated: true, organizationMatches: false, role: "COMPANY_ADMIN", permission: "READ", branchAllowed: true }).reason).toBe("organization_required");
  });

  it("inherits Company and Technical context into Service, but not into Finance", () => {
    const branches = [
      { id: "company", parentId: null, path: "company", depth: 0 },
      { id: "technical", parentId: "company", path: "company/technical", depth: 1 },
      { id: "service", parentId: "technical", path: "company/technical/service", depth: 2 },
      { id: "finance", parentId: "company", path: "company/finance", depth: 1 },
    ];
    const visible = resolveVisibleBranchIds(branches, [{ branchId: "service", access: "READ" }]);
    expect([...visible]).toEqual(expect.arrayContaining(["company", "technical", "service"]));
    expect(visible.has("finance")).toBe(false);
  });

  it("lets an explicit deny override an inherited grant", () => {
    const branches = [
      { id: "company", parentId: null, path: "company", depth: 0 },
      { id: "finance", parentId: "company", path: "company/finance", depth: 1 },
      { id: "accounting", parentId: "finance", path: "company/finance/accounting", depth: 2 },
    ];
    const visible = resolveVisibleBranchIds(branches, [{ branchId: "company", access: "READ" }, { branchId: "finance", access: "DENY" }]);
    expect(visible.has("company")).toBe(true);
    expect(visible.has("finance")).toBe(false);
    expect(visible.has("accounting")).toBe(false);
  });

  it("derives expired state from an elapsed validity window", () => {
    const now = new Date("2026-08-31T12:00:00.000Z");
    expect(effectiveDecisionState("ACTIVE", new Date("2026-09-01T00:00:00.000Z"), now)).toBe("ACTIVE");
    expect(effectiveDecisionState("ACTIVE", new Date("2026-08-30T23:59:59.000Z"), now)).toBe("EXPIRED");
  });

  it("preserves historical superseded state", () => {
    expect(effectiveDecisionState("SUPERSEDED", null, new Date("2026-08-31T12:00:00.000Z"))).toBe("SUPERSEDED");
  });

  it("never places an unauthorized knowledge unit into LLM context", () => {
    const shared = { id: "shared", organizationId: "org-a", branchId: "service", branchName: "Service", type: "PROCESS", title: "Garantiefall", content: "Authorized process", scope: "TEAM", status: "APPROVED", createdById: "other", confidence: 0.9, sources: [], score: 0.8, matchMethod: "lexical" as const };
    const foreignBranch = { ...shared, id: "foreign-branch", branchId: "finance", content: "Secret finance data" };
    const privateOtherUser = { ...shared, id: "private-other", scope: "PERSONAL", status: "DRAFT", createdById: "other", content: "Private data" };
    const authorized = filterAuthorizedContext({ organizationId: "org-a", userId: "me", allowedBranchIds: ["service"], knowledge: [shared, foreignBranch, privateOtherUser], decisions: [] });
    const context = buildGroundedContext({ authorizedBranchIds: ["service"], ...authorized });
    expect(context.promptContext).toContain("Authorized process");
    expect(context.promptContext).not.toContain("Secret finance data");
    expect(context.promptContext).not.toContain("Private data");
  });

  it("returns an explicit unknown state when no verified context matches", () => {
    const context = buildGroundedContext({ authorizedBranchIds: ["service"], knowledge: [], decisions: [] });
    expect(context.status).toBe("UNKNOWN");
    expect(context.promptContext).toBe("");
  });

  it("marks conflicting active decisions instead of generating a single answer", () => {
    const base = { organizationId: "org-a", department: "Service", status: "ACTIVE" as const, validFrom: new Date("2026-01-01"), validUntil: null, exceptions: null, branchIds: ["service"], branchNames: ["Service"], sources: [], score: 0.8 };
    const context = buildGroundedContext({ authorizedBranchIds: ["service"], knowledge: [], decisions: [{ ...base, id: "d1", title: "Warranty", description: "Use process A", reason: "Policy A" }, { ...base, id: "d2", title: "Warranty", description: "Use process B", reason: "Policy B" }] });
    expect(context.status).toBe("CONFLICT");
    expect(context.conflicts).toHaveLength(1);
  });

  it("verifies password hashes without storing or comparing plaintext", () => {
    const encoded = hashPassword("a-local-password-long-enough");
    expect(encoded.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("a-local-password-long-enough", encoded)).toBe(true);
    expect(verifyPassword("wrong-password-long-enough", encoded)).toBe(false);
  });

  it("accepts the current TOTP window and rejects unrelated codes", () => {
    const secret = generateTotpSecret();
    const now = Date.parse("2026-09-01T00:00:00.000Z");
    const code = totpCode(secret, now);
    expect(verifyTotp(secret, code, now)).toBe(true);
    expect(verifyTotp(secret, "000000", now)).toBe(false);
  });
});
