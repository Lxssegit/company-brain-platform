export type RetrievalSource = {
  id: string;
  title: string;
  type: string;
  externalUrl: string | null;
  citation: string | null;
};

export type KnowledgeCandidate = {
  id: string;
  organizationId: string;
  branchId: string;
  branchName: string;
  type: string;
  title: string;
  content: string;
  scope: string;
  status: string;
  createdById: string;
  confidence: number | null;
  sources: RetrievalSource[];
  score: number;
  matchMethod: "lexical" | "vector" | "hybrid";
};

export type DecisionCandidate = {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  reason: string;
  department: string | null;
  status: "ACTIVE" | "SUPERSEDED" | "EXPIRED" | "DRAFT";
  validFrom: Date;
  validUntil: Date | null;
  exceptions: unknown;
  branchIds: string[];
  branchNames: string[];
  sources: RetrievalSource[];
  score: number;
};

export type DecisionConflict = {
  key: string;
  title: string;
  decisionIds: string[];
  explanation: string;
};

export type RetrievalResult = {
  status: "ANSWERABLE" | "UNKNOWN" | "CONFLICT";
  /** Whether vector search actually ran, so a silent downgrade is visible. */
  diagnostics?: { vectorSearch: "used" | "unavailable" | "not_configured"; candidateSource: "hybrid" | "lexical" | "recent" };
  authorizedBranchIds: string[];
  knowledge: KnowledgeCandidate[];
  decisions: DecisionCandidate[];
  conflicts: DecisionConflict[];
  citations: RetrievalSource[];
  promptContext: string;
};
