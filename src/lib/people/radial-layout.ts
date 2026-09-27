/**
 * A deterministic radial layout, computed on the server.
 *
 * The obvious thing to reach for is a force simulation, which is what every
 * knowledge-graph screenshot is. It settles differently on every load, so the
 * same company never looks the same twice and nothing can be pointed at across
 * two screens; it needs a client bundle and a few hundred ticks before it is
 * readable; and once past about fifty nodes it produces a hairball that is
 * pleasant to watch and useless to read.
 *
 * This walks the tree the data already is. Every node gets an angular wedge in
 * proportion to how many leaves hang under it, so a crowded department takes
 * the room it needs and a thin one does not. The result is stable, needs no
 * JavaScript in the browser, and puts the same branch in the same place today
 * and tomorrow.
 */
export type LayoutInput = {
  id: string;
  parentId: string | null;
  /** Leaves are laid out at a tighter radius than the structure they hang off. */
  weight?: number;
};

export type Placed = { id: string; x: number; y: number; angle: number; radius: number; depth: number };

export type LayoutResult = {
  placed: Map<string, Placed>;
  /** Half the extent actually used, so the caller can size a square viewBox without guessing. */
  extent: number;
};

const TAU = Math.PI * 2;

export function radialLayout(nodes: LayoutInput[], options: { ringGap?: number; startAngle?: number } = {}): LayoutResult {
  const ringGap = options.ringGap ?? 130;
  const childrenOf = new Map<string | null, LayoutInput[]>();
  for (const node of nodes) {
    const bucket = childrenOf.get(node.parentId) ?? [];
    bucket.push(node);
    childrenOf.set(node.parentId, bucket);
  }

  const roots = childrenOf.get(null) ?? [];
  const placed = new Map<string, Placed>();
  if (roots.length === 0) return { placed, extent: 0 };

  /* Leaf count drives the wedge. A node with no children counts as one so that
     a branch holding twenty notes is not squeezed to the same slice as a branch
     holding one. */
  const leafCount = new Map<string, number>();
  function countLeaves(node: LayoutInput): number {
    const children = childrenOf.get(node.id) ?? [];
    const count = children.length === 0 ? 1 : children.reduce((sum, child) => sum + countLeaves(child), 0);
    leafCount.set(node.id, count);
    return count;
  }
  for (const root of roots) countLeaves(root);

  let extent = 0;
  function place(node: LayoutInput, depth: number, from: number, to: number) {
    const angle = (from + to) / 2;
    /* Depth 0 sits at the centre; a root pushed out to a ring would leave a
       hole where the one node everything hangs off belongs. */
    const radius = depth === 0 ? 0 : depth * ringGap * (node.weight ?? 1);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    placed.set(node.id, { id: node.id, x, y, angle, radius, depth });
    extent = Math.max(extent, radius);

    const children = childrenOf.get(node.id) ?? [];
    if (children.length === 0) return;
    const span = to - from;
    const total = children.reduce((sum, child) => sum + (leafCount.get(child.id) ?? 1), 0);
    let cursor = from;
    for (const child of children) {
      const share = ((leafCount.get(child.id) ?? 1) / total) * span;
      place(child, depth + 1, cursor, cursor + share);
      cursor += share;
    }
  }

  const start = options.startAngle ?? -Math.PI / 2;
  const totalLeaves = roots.reduce((sum, root) => sum + (leafCount.get(root.id) ?? 1), 0);
  let cursor = start;
  for (const root of roots) {
    const share = ((leafCount.get(root.id) ?? 1) / totalLeaves) * TAU;
    place(root, 0, cursor, cursor + share);
    cursor += share;
  }

  return { placed, extent };
}
