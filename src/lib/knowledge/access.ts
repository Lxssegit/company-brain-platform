import type { KnowledgeStatus, RoleKey } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { getVisibleBranches } from "@/lib/branches/access";
import { hasRolePermission } from "@/lib/permissions/policy";

const elevatedRoles: RoleKey[] = ["SUPER_ADMIN", "COMPANY_ADMIN"];
const reviewerRoles: RoleKey[] = ["SUPER_ADMIN", "COMPANY_ADMIN", "DEPARTMENT_ADMIN", "MANAGER"];

export async function visibleKnowledgeWhere(user: { id: string; organizationId: string | null; role?: { key: RoleKey } | null }, branchId?: string, status?: KnowledgeStatus): Promise<Prisma.KnowledgeUnitWhereInput | null> {
  if (!user.organizationId) return null;
  const branches = await getVisibleBranches(user);
  const branchIds = branches.map((branch) => branch.id);
  if (branchId && !branchIds.includes(branchId)) return null;

  /* Someone who may approve a unit must be able to read it, otherwise
     GET /api/knowledge?status=PENDING_REVIEW returns nothing for the very
     people /api/reviews already shows those units to. */
  const canReview = hasRolePermission(user.role?.key, "APPROVE");

  return {
    organizationId: user.organizationId,
    branchId: branchId ? branchId : { in: branchIds },
    ...(status ? { status } : {}),
    OR: [
      { status: "APPROVED", scope: { not: "PERSONAL" } },
      { createdById: user.id },
      ...(canReview ? [{ status: "PENDING_REVIEW" as const, scope: { not: "PERSONAL" as const } }] : []),
    ],
  };
}

/**
 * Who may change a unit somebody else wrote. The permission argument is part of
 * the answer, not decoration: DELETE is narrower than EDIT, and an earlier
 * version of this function returned the same result for both.
 */
export function canManageKnowledge(user: { id: string; role?: { key: RoleKey } | null }, createdById: string, permission: "EDIT" | "DELETE") {
  if (createdById === user.id) return true;
  const role = user.role?.key;
  if (!role) return false;
  if (permission === "DELETE") return elevatedRoles.includes(role);
  return reviewerRoles.includes(role);
}

export function canApproveWithoutReview(role: RoleKey | null | undefined) {
  return role === "SUPER_ADMIN" || role === "COMPANY_ADMIN" || role === "DEPARTMENT_ADMIN";
}
