import { describe, expect, it } from "vitest";
import { radialLayout, type LayoutInput } from "@/lib/people/radial-layout";

const tree: LayoutInput[] = [
  { id: "root", parentId: null },
  { id: "a", parentId: "root" },
  { id: "b", parentId: "root" },
  { id: "a1", parentId: "a" },
  { id: "a2", parentId: "a" },
  { id: "a3", parentId: "a" },
  { id: "b1", parentId: "b" },
];

describe("radialLayout", () => {
  it("puts the root in the middle", () => {
    const { placed } = radialLayout(tree);
    expect(placed.get("root")).toMatchObject({ x: 0, y: 0, radius: 0, depth: 0 });
  });

  it("puts each generation on its own ring", () => {
    const { placed } = radialLayout(tree, { ringGap: 100 });
    expect(placed.get("a")!.radius).toBe(100);
    expect(placed.get("a1")!.radius).toBe(200);
  });

  /* The whole reason for weighting by leaves: a branch with three children must
     not be squeezed into the same slice as a branch with one, or a busy
     department becomes unreadable while an empty one gets half the picture. */
  it("gives a crowded subtree more room than a thin one", () => {
    const { placed } = radialLayout(tree);
    const spread = (ids: string[]) => {
      const angles = ids.map((id) => placed.get(id)!.angle);
      return Math.max(...angles) - Math.min(...angles);
    };
    expect(spread(["a1", "a2", "a3"])).toBeGreaterThan(spread(["b1"]));
  });

  it("places the same tree identically every time", () => {
    const once = radialLayout(tree);
    const twice = radialLayout(tree);
    for (const [id, node] of once.placed) {
      expect(twice.placed.get(id)).toEqual(node);
    }
  });

  it("reports an extent that contains every node", () => {
    const { placed, extent } = radialLayout(tree);
    for (const node of placed.values()) {
      expect(Math.hypot(node.x, node.y)).toBeLessThanOrEqual(extent + 1e-9);
    }
  });

  it("survives an empty graph and a lone node", () => {
    expect(radialLayout([]).placed.size).toBe(0);
    const lone = radialLayout([{ id: "only", parentId: null }]);
    expect(lone.placed.get("only")).toMatchObject({ x: 0, y: 0 });
  });

  /* A branch whose parent is filtered out for permissions arrives here as a
     second root rather than an orphan. It must still be placed, not dropped. */
  it("lays out a forest, not just a tree", () => {
    const forest: LayoutInput[] = [
      { id: "one", parentId: null },
      { id: "two", parentId: null },
      { id: "two-child", parentId: "two" },
    ];
    const { placed } = radialLayout(forest);
    expect(placed.size).toBe(3);
    expect(placed.get("one")!.angle).not.toBe(placed.get("two")!.angle);
  });
});
