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

function hasDeniedAncestorOrSelf(branchId: string, byId: Map<string, BranchNode>, denied: Set<string>) {
  return hasDeniedAncestor(branchId, byId, denied);
}

/**
 * Reading inherits upward: a grant on a team lets you read the department and
 * company context above it. Administering must not follow that direction, or a
 * grant on one team would let its holder rename or delete everything above it.
 *
 * Authority flows the other way. An explicit grant lets you administer that
 * branch and everything nested under it, and an explicit deny still wins.
 */
export function resolveAdministrableBranchIds(branches: BranchNode[], grants: BranchGrant[], elevated = false) {
  if (elevated) return new Set(branches.map((branch) => branch.id));

  const byId = new Map(branches.map((branch) => [branch.id, branch]));
  const denied = new Set(grants.filter((grant) => grant.access === "DENY").map((grant) => grant.branchId));
  const roots = grants.filter((grant) => grant.access === "READ" && byId.has(grant.branchId)).map((grant) => grant.branchId);
  const administrable = new Set<string>();

  for (const branch of branches) {
    if (hasDeniedAncestorOrSelf(branch.id, byId, denied)) continue;
    let current: BranchNode | undefined = byId.get(branch.id);
    while (current) {
      if (roots.includes(current.id)) { administrable.add(branch.id); break; }
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
  }

  return administrable;
}
