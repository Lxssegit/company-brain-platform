import { describe, expect, it } from "vitest";
import { reachConsequence, scopeForBranchKind } from "@/lib/knowledge/reach";

/**
 * This sentence is the product's promise stated before the person acts. If it
 * is wrong, the page lies about who will see what — the one failure this
 * product cannot afford.
 */
describe("reachConsequence", () => {
  it("promises privacy when the entry is not shared", () => {
    const text = reachConsequence({ shared: false });
    expect(text).toContain("bleibt bei Ihnen");
    expect(text).toContain("niemand sonst");
  });

  it("names the branch and the reviewer when the author cannot self-approve", () => {
    const text = reachConsequence({ shared: true, hasTargets: true, selfApproves: false, branch: { name: "Service", kind: "TEAM" } });
    expect(text).toContain("Service");
    expect(text).toContain("Verantwortlichen");
    expect(text).not.toContain("Sofort sichtbar");
  });

  it("says the entry is immediately visible when the author may publish", () => {
    const text = reachConsequence({ shared: true, hasTargets: true, selfApproves: true, branch: { name: "Service", kind: "TEAM" } });
    expect(text).toContain("Sofort sichtbar");
    expect(text).toContain("Service");
    expect(text).not.toContain("Verantwortlichen");
  });

  it("asks for the branch before promising anything about reach", () => {
    const text = reachConsequence({ shared: true, hasTargets: true, selfApproves: true, branch: null });
    expect(text).toContain("Wählen Sie den Zweig");
    expect(text).not.toContain("sichtbar für alle");
  });

  it("does not offer sharing when no branch is available", () => {
    const text = reachConsequence({ shared: true, hasTargets: false, selfApproves: false, branch: null });
    expect(text).toContain("keinen Zweig");
  });
});

/**
 * Scope and branch both describe reach. Deriving one from the other is what
 * keeps them from disagreeing — an entry labelled TEAM sitting in a company
 * branch is visible company-wide.
 */
describe("scopeForBranchKind", () => {
  it("mirrors the branch kind exactly", () => {
    expect(scopeForBranchKind("COMPANY")).toBe("COMPANY");
    expect(scopeForBranchKind("DEPARTMENT")).toBe("DEPARTMENT");
    expect(scopeForBranchKind("TEAM")).toBe("TEAM");
    expect(scopeForBranchKind("PERSONAL")).toBe("PERSONAL");
  });
});
