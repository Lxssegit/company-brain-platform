import type { KnowledgeStatus, RoleKey } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { getVisibleBranches } from "@/lib/branches/access";

const elevatedRoles: RoleKey[] = ["SUPER_ADMIN", "COMPANY_ADMIN"];

export async function visibleKnowledgeWhere(user: { id: string; organizationId: string | null; role?: { key: RoleKey } | null }, branchId?: string, status?: KnowledgeStatus): Promise<Prisma.KnowledgeUnitWhereInput | null> {
  if (!user.organizationId) return null;
  const branches = await getVisibleBranches(user);
  const branchIds = branches.map((branch) => branch.id);
  if (branchId && !branchIds.includes(branchId)) return null;
  return {
    organizationId: user.organizationId,
    branchId: branchId ? branchId : { in: branchIds },
    ...(status ? { status } : {}),
    OR: [
      { status: "APPROVED", scope: { not: "PERSONAL" } },
      { createdById: user.id },
    ],
  };
}

export function canManageKnowledge(user: { id: string; role?: { key: RoleKey } | null }, createdById: string, permission: "EDIT" | "DELETE") {
  if (createdById === user.id) return true;
  if (permission === "DELETE" && elevatedRoles.includes(user.role?.key as RoleKey)) return true;
  return user.role?.key === "SUPER_ADMIN" || user.role?.key === "COMPANY_ADMIN" || user.role?.key === "DEPARTMENT_ADMIN" || user.role?.key === "MANAGER";
}

export function canApproveWithoutReview(role: RoleKey | null | undefined) {
  return role === "SUPER_ADMIN" || role === "COMPANY_ADMIN" || role === "DEPARTMENT_ADMIN";
}
