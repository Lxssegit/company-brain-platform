import type { PermissionKey, RoleKey } from "@prisma/client";
import { requireOrganizationUser } from "@/lib/auth/current-user";
import { hasRolePermission } from "@/lib/permissions/policy";

export async function requirePermission(permission: PermissionKey) {
  const user = await requireOrganizationUser();
  const role = user.role?.key as RoleKey | undefined;
  if (!hasRolePermission(role, permission)) throw new Error("FORBIDDEN");
  return user;
}
