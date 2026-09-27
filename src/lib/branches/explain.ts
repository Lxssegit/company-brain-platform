import type { BranchGrant, BranchNode } from "@/lib/branches/tree";

/**
 * Why a person can — or cannot — read a branch.
 *
 * resolveVisibleBranchIds answers whether, which is what the query layer needs.
 * A person looking at someone else's access needs the other half: an admin who
 * can see that Ms Koch reads Sales, but not that she reads it only because a
 * grant on one team below it pulls the context above into view, cannot tell a
 * deliberate arrangement from an accident. Unexplained permissions are how
 * over-broad access survives review.
 *
 * The reasons mirror the resolution rules one for one, so this stays honest
 * when those rules change rather than drifting into a plausible story:
 *   ROLE      the role clears the whole organization
 *   DIRECT    an explicit READ grant on this branch
 *   CONTEXT   pulled in from below, because reading a branch means reading the
 *             branches it hangs under
 *   DENIED    an explicit DENY here or above, which beats any READ
 *   NONE      nothing grants it
 */
export type AccessReason = "ROLE" | "DIRECT" | "CONTEXT" | "DENIED" | "NONE";

export type BranchAccessExplanation = {
  branchId: string;
  visible: boolean;
  reason: AccessReason;
  /** For CONTEXT, the granted branch below that pulled this one into view. For DENIED, the branch carrying the deny. */
  viaBranchId: string | null;
};

function ancestorChain(branchId: string, byId: Map<string, BranchNode>) {
  const chain: BranchNode[] = [];
  let current = byId.get(branchId);
  while (current) {
    chain.push(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return chain;
}

function denyingAncestor(branchId: string, byId: Map<string, BranchNode>, denied: Set<string>) {
  return ancestorChain(branchId, byId).find((node) => denied.has(node.id)) ?? null;
}

export function explainBranchAccess(
  branches: BranchNode[],
  grants: BranchGrant[],
  elevated = false,
): BranchAccessExplanation[] {
  const byId = new Map(branches.map((branch) => [branch.id, branch]));
  const denied = new Set(grants.filter((grant) => grant.access === "DENY").map((grant) => grant.branchId));
  const directly = new Set(grants.filter((grant) => grant.access === "READ").map((grant) => grant.branchId));

  return branches.map((branch) => {
    /* Elevated is checked before the deny, because that is the order
       resolveVisibleBranchIds uses: it returns every branch for an elevated
       role without reading the grants at all. Whether a deny *should* bind a
       company admin is a real question, but it is a question about the rule,
       not about this function — an explanation that disagreed with the
       resolution would make the profile page state something the branch
       listing contradicts one click away. */
    if (elevated) {
      return { branchId: branch.id, visible: true, reason: "ROLE" as const, viaBranchId: null };
    }
    const blocking = denyingAncestor(branch.id, byId, denied);
    if (blocking) {
      return { branchId: branch.id, visible: false, reason: "DENIED" as const, viaBranchId: blocking.id };
    }
    if (directly.has(branch.id)) {
      return { branchId: branch.id, visible: true, reason: "DIRECT" as const, viaBranchId: null };
    }
    /* Context flows upward only: a grant below brings this branch into view.
       The nearest such grant is the honest explanation — naming a deeper one
       when a closer grant already suffices would overstate the dependency. */
    const source = branches
      .filter((candidate) => directly.has(candidate.id) && !denyingAncestor(candidate.id, byId, denied))
      .filter((candidate) => ancestorChain(candidate.id, byId).some((node) => node.id === branch.id))
      .sort((a, b) => a.depth - b.depth)[0];
    if (source) {
      return { branchId: branch.id, visible: true, reason: "CONTEXT" as const, viaBranchId: source.id };
    }
    return { branchId: branch.id, visible: false, reason: "NONE" as const, viaBranchId: null };
  });
}

const wording: Record<AccessReason, string> = {
  ROLE: "Über die Rolle, die die ganze Organisation umfasst",
  DIRECT: "Direkt freigegeben",
  CONTEXT: "Als Kontext, weil ein Zweig darunter freigegeben ist",
  DENIED: "Gesperrt",
  NONE: "Nicht freigegeben",
};

export function describeAccessReason(reason: AccessReason) {
  return wording[reason];
}
