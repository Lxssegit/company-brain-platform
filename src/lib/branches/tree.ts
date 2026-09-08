import type { BranchAccess } from "@prisma/client";

export type BranchNode = {
  id: string;
  parentId: string | null;
  path: string;
  depth: number;
};

export type BranchGrant = { branchId: string; access: BranchAccess };

function hasDeniedAncestor(branchId: string, byId: Map<string, BranchNode>, denied: Set<string>) {
  let current: BranchNode | undefined = byId.get(branchId);
  while (current) {
    if (denied.has(current.id)) return true;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return false;
}

/** Resolves inherited visibility without copying data into child branches. */
export function resolveVisibleBranchIds(branches: BranchNode[], grants: BranchGrant[], elevated = false) {
  if (elevated) return new Set(branches.map((branch) => branch.id));

  const byId = new Map(branches.map((branch) => [branch.id, branch]));
  const denied = new Set(grants.filter((grant) => grant.access === "DENY").map((grant) => grant.branchId));
  const visible = new Set<string>();

  for (const grant of grants.filter((item) => item.access === "READ")) {
    if (!byId.has(grant.branchId) || hasDeniedAncestor(grant.branchId, byId, denied)) continue;
    let current: BranchNode | undefined = byId.get(grant.branchId);
    while (current && !hasDeniedAncestor(current.id, byId, denied)) {
      visible.add(current.id);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
  }

  return visible;
}

export function getInheritancePath(branchId: string, branches: BranchNode[]) {
  const byId = new Map(branches.map((branch) => [branch.id, branch]));
  const path: BranchNode[] = [];
  let current: BranchNode | undefined = byId.get(branchId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}
