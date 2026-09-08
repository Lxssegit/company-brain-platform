import type { Prisma, RoleKey } from "@prisma/client";
import { getVisibleBranches } from "@/lib/branches/access";

export async function visibleDecisionWhere(user: { id: string; organizationId: string | null; role?: { key: RoleKey } | null }, branchId?: string): Promise<Prisma.DecisionWhereInput | null> {
  if (!user.organizationId) return null;
  const branches = await getVisibleBranches(user);
  const branchIds = branches.map((branch) => branch.id);
  if (branchId && !branchIds.includes(branchId)) return null;
  return { organizationId: user.organizationId, affectedBranches: { some: { branchId: branchId ?? { in: branchIds } } } };
}
