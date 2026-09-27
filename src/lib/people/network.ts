import type { BranchKind, RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getVisibleBranches } from "@/lib/branches/access";

type Viewer = { id: string; organizationId: string | null; role?: { key: RoleKey } | null };

export type NetworkNode =
  | { id: string; kind: "branch"; label: string; subtitle: string | null; branchKind: BranchKind; href: string }
  | { id: string; kind: "person"; label: string; subtitle: string | null; href: string }
  | { id: string; kind: "knowledge"; label: string; subtitle: string | null; href: string };

export type NetworkEdge = { from: string; to: string; kind: "structure" | "membership" | "authorship" };

/**
 * The network is drawn from the branches this viewer may read, and nothing
 * else. It is tempting to build the whole company graph and hide the parts the
 * viewer should not see, because a full graph looks better — and that is
 * exactly the retrieve-then-filter mistake ARCHITECTURE.md rejects for search.
 * A picture leaks the same way a search result does: a node with no label still
 * says a team exists, how big it is and who sits next to it.
 *
 * So the visible branch set comes first, and every person, every unit and every
 * line is derived from it.
 *
 * Personal branches are not drawn as places. Every person has one, it carries
 * their name, and drawing both put two identically labelled dots on top of each
 * other at every leaf of the tree — which read as a rendering fault rather than
 * as the two things they are. Here a personal branch is its owner: the person
 * takes its position, and whatever it holds hangs off them.
 */
export async function loadNetwork(viewer: Viewer) {
  if (!viewer.organizationId) return { nodes: [], edges: [], omitted: 0 };

  const visible = await getVisibleBranches(viewer);
  const visibleIds = visible.map((branch) => branch.id);
  const total = await prisma.branch.count({ where: { organizationId: viewer.organizationId } });
  if (visibleIds.length === 0) return { nodes: [], edges: [], omitted: total };

  const [memberships, units] = await Promise.all([
    prisma.branchMember.findMany({
      where: { branchId: { in: visibleIds }, access: "READ" },
      select: { branchId: true, user: { select: { id: true, name: true, email: true, jobTitle: true, status: true } } },
    }),
    prisma.knowledgeUnit.findMany({
      where: { organizationId: viewer.organizationId, branchId: { in: visibleIds }, status: "APPROVED" },
      select: { id: true, title: true, branchId: true, createdById: true },
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
  ]);

  const structural = visible.filter((branch) => branch.kind !== "PERSONAL");
  const structuralIds = new Set(structural.map((branch) => branch.id));
  /* Which person stands in for which personal branch, so anything that points
     at the branch can be redirected to them. ownerUserId is the authority; a
     personal branch without one is a branch nobody claims, so it stays a place. */
  const standInFor = new Map<string, string>();
  const orphanPersonal: typeof visible = [];
  for (const branch of visible) {
    if (branch.kind !== "PERSONAL") continue;
    if (branch.ownerUserId) standInFor.set(branch.id, branch.ownerUserId);
    else orphanPersonal.push(branch);
  }

  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];

  for (const branch of [...structural, ...orphanPersonal]) {
    nodes.push({
      id: `b:${branch.id}`,
      kind: "branch",
      label: branch.name,
      subtitle: branch.description,
      branchKind: branch.kind,
      href: `/brain/${branch.id}`,
    });
  }
  for (const branch of [...structural, ...orphanPersonal]) {
    /* Only draw the line when the parent is visible too. Otherwise the edge
       itself would testify to a branch the viewer may not know about. */
    if (branch.parentId && structuralIds.has(branch.parentId)) {
      edges.push({ from: `b:${branch.parentId}`, to: `b:${branch.id}`, kind: "structure" });
    }
  }

  /* Where a person sits: the parent of their own personal branch, which is the
     team or department they actually belong to. Failing that, the deepest
     branch they hold a grant on — deepest because a grant on a team says more
     about where somebody works than the company root it implies. */
  const homeOf = new Map<string, string>();
  for (const branch of visible) {
    const ownerId = branch.kind === "PERSONAL" ? branch.ownerUserId : null;
    if (!ownerId || !branch.parentId || !structuralIds.has(branch.parentId)) continue;
    homeOf.set(ownerId, branch.parentId);
  }
  const depthOf = new Map(visible.map((branch) => [branch.id, branch.depth]));
  for (const membership of memberships) {
    const personId = membership.user.id;
    if (!structuralIds.has(membership.branchId)) continue;
    const current = homeOf.get(personId);
    if (current && (depthOf.get(current) ?? 0) >= (depthOf.get(membership.branchId) ?? 0)) continue;
    if (!current) homeOf.set(personId, membership.branchId);
  }

  const people = new Map<string, { id: string; name: string | null; email: string; jobTitle: string | null }>();
  for (const membership of memberships) {
    if (membership.user.status !== "ACTIVE") continue;
    people.set(membership.user.id, membership.user);
  }

  for (const person of people.values()) {
    const id = `p:${person.id}`;
    nodes.push({ id, kind: "person", label: person.name ?? person.email, subtitle: person.jobTitle, href: `/person/${person.id}` });
    const home = homeOf.get(person.id);
    if (home) edges.push({ from: `b:${home}`, to: id, kind: "structure" });
  }

  /* A grant on a branch that is not where somebody sits is the interesting one:
     it is access reaching sideways across the organization, and it is the line
     worth seeing. The one that merely restates where they already are is not. */
  for (const membership of memberships) {
    if (!people.has(membership.user.id)) continue;
    if (!structuralIds.has(membership.branchId)) continue;
    if (homeOf.get(membership.user.id) === membership.branchId) continue;
    edges.push({ from: `b:${membership.branchId}`, to: `p:${membership.user.id}`, kind: "membership" });
  }

  for (const unit of units) {
    const id = `k:${unit.id}`;
    const owner = standInFor.get(unit.branchId);
    const anchor = owner && people.has(owner) ? `p:${owner}` : structuralIds.has(unit.branchId) ? `b:${unit.branchId}` : null;
    if (!anchor) continue;
    nodes.push({ id, kind: "knowledge", label: unit.title, subtitle: null, href: `/brain/${unit.branchId}` });
    edges.push({ from: anchor, to: id, kind: "structure" });
    if (anchor !== `p:${unit.createdById}` && people.has(unit.createdById)) {
      edges.push({ from: `p:${unit.createdById}`, to: id, kind: "authorship" });
    }
  }

  return { nodes, edges, omitted: total - visible.length };
}

export type Network = Awaited<ReturnType<typeof loadNetwork>>;
