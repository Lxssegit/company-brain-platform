import type { PermissionKey, RoleKey } from "@prisma/client";

export type PermissionDecision = {
  allowed: boolean;
  reason: "allowed" | "unauthenticated" | "organization_required" | "role_denied" | "branch_denied";
};

const rolePermissions: Record<RoleKey, PermissionKey[]> = {
  SUPER_ADMIN: ["READ", "CREATE", "EDIT", "DELETE", "APPROVE", "MANAGE_USERS", "MANAGE_BRANCH", "MANAGE_DECISIONS"],
  COMPANY_ADMIN: ["READ", "CREATE", "EDIT", "DELETE", "APPROVE", "MANAGE_USERS", "MANAGE_BRANCH", "MANAGE_DECISIONS"],
  DEPARTMENT_ADMIN: ["READ", "CREATE", "EDIT", "APPROVE", "MANAGE_BRANCH", "MANAGE_DECISIONS"],
  MANAGER: ["READ", "CREATE", "EDIT", "APPROVE"],
  EMPLOYEE: ["READ", "CREATE"],
};

export function hasRolePermission(role: RoleKey | null | undefined, permission: PermissionKey) {
  return !!role && rolePermissions[role].includes(permission);
}

export function decidePermission(input: {
  authenticated: boolean;
  organizationMatches: boolean;
  role: RoleKey | null | undefined;
  permission: PermissionKey;
  branchAllowed?: boolean;
}): PermissionDecision {
  if (!input.authenticated) return { allowed: false, reason: "unauthenticated" };
  if (!input.organizationMatches) return { allowed: false, reason: "organization_required" };
  if (!hasRolePermission(input.role, input.permission)) return { allowed: false, reason: "role_denied" };
  if (input.branchAllowed === false) return { allowed: false, reason: "branch_denied" };
  return { allowed: true, reason: "allowed" };
}

export function assertPermission(input: Parameters<typeof decidePermission>[0]) {
  const decision = decidePermission(input);
  if (!decision.allowed) throw new Error(`FORBIDDEN:${decision.reason}`);
  return decision;
}
