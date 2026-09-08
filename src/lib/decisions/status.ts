export type DecisionState = "ACTIVE" | "SUPERSEDED" | "EXPIRED" | "DRAFT";

export function effectiveDecisionState(status: DecisionState, validUntil: Date | null, now = new Date()): DecisionState {
  if (status === "ACTIVE" && validUntil && validUntil.getTime() <= now.getTime()) return "EXPIRED";
  return status;
}
