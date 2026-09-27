import { describe, expect, it } from "vitest";
import { explainBranchAccess } from "@/lib/branches/explain";
import { resolveVisibleBranchIds, type BranchGrant, type BranchNode } from "@/lib/branches/tree";

/*
  company
  ├── sales
  │   ├── sales-inside
  │   └── sales-field
  └── people            (the branch a company would actually want fenced off)
      └── people-payroll
*/
const branches: BranchNode[] = [
  { id: "company", parentId: null, path: "/company", depth: 0 },
  { id: "sales", parentId: "company", path: "/company/sales", depth: 1 },
  { id: "sales-inside", parentId: "sales", path: "/company/sales/inside", depth: 2 },
  { id: "sales-field", parentId: "sales", path: "/company/sales/field", depth: 2 },
  { id: "people", parentId: "company", path: "/company/people", depth: 1 },
  { id: "people-payroll", parentId: "people", path: "/company/people/payroll", depth: 2 },
];

function explanationFor(grants: BranchGrant[], elevated: boolean, branchId: string) {
  const found = explainBranchAccess(branches, grants, elevated).find((row) => row.branchId === branchId);
  if (!found) throw new Error(`no explanation for ${branchId}`);
  return found;
}

describe("explainBranchAccess", () => {
  it("names a direct grant as direct", () => {
    const grants: BranchGrant[] = [{ branchId: "sales-inside", access: "READ" }];
    expect(explanationFor(grants, false, "sales-inside")).toMatchObject({ visible: true, reason: "DIRECT" });
  });

  it("names the branch below that pulled a parent into view", () => {
    const grants: BranchGrant[] = [{ branchId: "sales-inside", access: "READ" }];
    expect(explanationFor(grants, false, "sales")).toMatchObject({ visible: true, reason: "CONTEXT", viaBranchId: "sales-inside" });
    expect(explanationFor(grants, false, "company")).toMatchObject({ visible: true, reason: "CONTEXT", viaBranchId: "sales-inside" });
  });

  it("credits the nearest grant when several below would do", () => {
    const grants: BranchGrant[] = [
      { branchId: "sales", access: "READ" },
      { branchId: "sales-inside", access: "READ" },
    ];
    /* sales is directly granted, so it is not context at all; company is, and
       the honest source is sales — the closer one. Naming sales-inside would
       suggest company hangs on a deeper grant than it does. */
    expect(explanationFor(grants, false, "company")).toMatchObject({ reason: "CONTEXT", viaBranchId: "sales" });
  });

  it("does not leak a sibling into view", () => {
    const grants: BranchGrant[] = [{ branchId: "sales-inside", access: "READ" }];
    expect(explanationFor(grants, false, "sales-field")).toMatchObject({ visible: false, reason: "NONE" });
    expect(explanationFor(grants, false, "people")).toMatchObject({ visible: false, reason: "NONE" });
  });

  it("names the branch carrying a deny, including an inherited one", () => {
    const grants: BranchGrant[] = [
      { branchId: "people-payroll", access: "READ" },
      { branchId: "people", access: "DENY" },
    ];
    expect(explanationFor(grants, false, "people")).toMatchObject({ visible: false, reason: "DENIED", viaBranchId: "people" });
    expect(explanationFor(grants, false, "people-payroll")).toMatchObject({ visible: false, reason: "DENIED", viaBranchId: "people" });
  });

  it("reports an elevated role as the reason, matching how the resolver treats it", () => {
    const grants: BranchGrant[] = [{ branchId: "people", access: "DENY" }];
    expect(explanationFor(grants, true, "people")).toMatchObject({ visible: true, reason: "ROLE" });
  });

  /* The explanation exists to be shown next to the access it explains. The one
     way it can do real harm is by disagreeing with the rule that actually
     gates retrieval, so that is what this asserts — across every combination
     of grants over this tree, not a chosen few. */
  it("agrees with the resolver on every combination of grants", () => {
    const targets = branches.map((branch) => branch.id);
    const options: (BranchGrant["access"] | null)[] = [null, "READ", "DENY"];
    const total = options.length ** targets.length;

    for (let n = 0; n < total; n += 1) {
      let rest = n;
      const grants: BranchGrant[] = [];
      for (const branchId of targets) {
        const access = options[rest % options.length];
        rest = Math.floor(rest / options.length);
        if (access) grants.push({ branchId, access });
      }
      for (const elevated of [false, true]) {
        const resolved = resolveVisibleBranchIds(branches, grants, elevated);
        for (const row of explainBranchAccess(branches, grants, elevated)) {
          expect(row.visible, `grants=${JSON.stringify(grants)} elevated=${elevated} branch=${row.branchId}`)
            .toBe(resolved.has(row.branchId));
        }
      }
    }
  });
});
