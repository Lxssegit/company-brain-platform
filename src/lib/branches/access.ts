import type { RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { resolveVisibleBranchIds } from "@/lib/branches/tree";

const elevatedRoles: RoleKey[] = ["SUPER_ADMIN", "COMPANY_ADMIN"];

export async function getVisibleBranches(user: { id: string; organizationId: string | null; role?: { key: RoleKey } | null }) {
  if (!user.organizationId) return [];
  const branches = await prisma.branch.findMany({ where: { organizationId: user.organizationId }, orderBy: [{ depth: "asc" }, { name: "asc" }] });
  if (elevatedRoles.includes(user.role?.key as RoleKey)) return branches;

  const grants = await prisma.branchMember.findMany({ where: { userId: user.id, branch: { organizationId: user.organizationId } }, select: { branchId: true, access: true } });
  const allowedIds = resolveVisibleBranchIds(branches, grants);
  return branches.filter((branch) => allowedIds.has(branch.id));
}

export async function canReadBranch(user: { id: string; organizationId: string | null; role?: { key: RoleKey } | null }, branchId: string) {
  const branches = await getVisibleBranches(user);
  return branches.some((branch) => branch.id === branchId);
}
