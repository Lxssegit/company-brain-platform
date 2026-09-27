import type { PermissionKey, RoleKey } from "@prisma/client";
import { requireOrganizationUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/permissions/policy";

/**
 * The single gate every route handler passes through. It delegates to
 * assertPermission so the policy that is unit-tested is the policy that runs;
 * an earlier version reimplemented the check inline and left the tested one
 * unreachable.
 */
export async function requirePermission(permission: PermissionKey) {
  const user = await requireOrganizationUser();
  assertPermission({
    authenticated: true,
    organizationMatches: Boolean(user.organizationId && user.organization),
    role: user.role?.key as RoleKey | undefined,
    permission,
  });
  return user;
}
