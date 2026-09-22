import type { BranchKind, KnowledgeScope } from "@prisma/client";

/**
 * Reach is one decision, not two. An entry's scope and the branch it lives in
 * both describe who can see it, so letting a person set them independently
 * lets them disagree: "Team" scope in a company branch is visible company-wide
 * while labelled Team. The branch decides; the scope follows it.
 */
export function scopeForBranchKind(kind: BranchKind): KnowledgeScope {
  switch (kind) {
    case "COMPANY": return "COMPANY";
    case "DEPARTMENT": return "DEPARTMENT";
    case "TEAM": return "TEAM";
    case "PERSONAL": return "PERSONAL";
  }
}

export type ReachChoice =
  | { shared: false }
  | { shared: true; branch: { name: string; kind: BranchKind } | null; hasTargets: boolean; selfApproves: boolean };

/**
 * What pressing the button will do, in the words the person needs before they
 * press it rather than after.
 */
export function reachConsequence(choice: ReachChoice): string {
  if (!choice.shared) {
    return "Das bleibt bei Ihnen. Es liegt in Ihrem persönlichen Zweig, und niemand sonst sieht es — auch Ihre Teamleitung nicht.";
  }
  if (!choice.hasTargets) {
    return "Sie haben keinen Zweig, in den Sie einstellen könnten. Bis jemand Ihnen einen Zweig freigibt, bleibt nur der persönliche.";
  }
  if (!choice.branch) {
    return "Wählen Sie den Zweig, in den es gehört. Danach steht hier, wer es sehen wird und wer darüber entscheidet.";
  }
  const where = `„${choice.branch.name}“`;
  return choice.selfApproves
    ? `Sofort sichtbar für alle, die ${where} lesen dürfen. Ihre Rolle darf ohne Freigabe veröffentlichen.`
    : `Das geht an die Verantwortlichen von ${where}. Bis zur Freigabe sieht es niemand außer Ihnen und ihnen.`;
}
