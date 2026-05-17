export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type ClauseCategory =
  | "liability"
  | "termination"
  | "renewal"
  | "payment"
  | "privacy"
  | "ip"
  | "employment"
  | "arbitration"
  | "confidentiality"
  | "governing-law"
  | "compliance"
  | "ambiguity"
  | "general";

export type ClauseFinding = {
  id: string;
  title: string;
  category: ClauseCategory;
  severity: Severity;
  confidence: number;
  evidence: string;
  explanation: string;
  impact: string;
  recommendation: string;
  counterpartyArgument: string;
  userArgument: string;
  negotiationAsk: string;
  visualSignals?: {
    impact: string;
    ask: string;
    counter: string;
    position: string;
  };
};

export type RiskAxis = {
  name: string;
  score: number;
  rationale: string;
};

export type CoverageSection = {
  id: string;
  title: string;
  wordCount: number;
  riskSignalCount: number;
  confidence: number;
  status: "reviewed" | "needs-review" | "limited";
  notes: string[];
};

export type UncertaintyNote = {
  title: string;
  reason: string;
  action: string;
};

export type Scenario = {
  name: string;
  likelihood: "low" | "medium" | "high";
  consequence: string;
  trigger: string;
  mitigation: string;
};

export type MissingTerm = {
  term: string;
  risk: string;
  suggestedQuestion: string;
};

export type AnalysisReport = {
  contractType: string;
  executiveDecision: "safe-to-review" | "negotiate-first" | "do-not-sign-yet";
  decisionDisplay?: {
    title: string;
    badge: string;
    stages: [string, string, string];
    activeStage: number;
  };
  riskScore: number;
  summary: string;
  inputStats: {
    words: number;
    clauses: number;
    sections: number;
    truncated: boolean;
  };
  findings: ClauseFinding[];
  riskAxes: RiskAxis[];
  scenarios: Scenario[];
  missingTerms: MissingTerm[];
  negotiationPlaybook: string[];
  trustLedger: string[];
  edgeWarnings: string[];
  coverageMap: CoverageSection[];
  uncertaintyNotes: UncertaintyNote[];
  source: "deterministic" | "llm-enhanced";
  persistence?: {
    saved: boolean;
    analysisId?: string;
    reason?: string;
  };
};

export type AnalyzeRequest = {
  text: string;
  fileName?: string;
};
