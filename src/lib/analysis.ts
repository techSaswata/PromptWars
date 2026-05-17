import type {
  AnalysisReport,
  ClauseCategory,
  ClauseFinding,
  CoverageSection,
  MissingTerm,
  RiskAxis,
  Scenario,
  Severity,
  UncertaintyNote
} from "./types";

const SECTION_TARGET_WORDS = 850;
const SECTION_OVERLAP_WORDS = 120;
const MAX_SECTIONS = 80;
const MIN_VISIBLE_FINDING_CONFIDENCE = 0.64;

const categoryRules: Array<{
  category: ClauseCategory;
  title: string;
  terms: string[];
  severity: Severity;
  impact: string;
  recommendation: string;
  negotiationAsk: string;
}> = [
  {
    category: "liability",
    title: "Broad liability shift or liability cap",
    terms: ["liability", "indemnify", "indemnification", "hold harmless", "damages", "limitation of liability"],
    severity: "high",
    impact: "You may absorb losses, legal costs, or third-party claims that are not fully under your control.",
    recommendation: "Cap liability, exclude indirect damages, and require mutual responsibility for each party's own misconduct.",
    negotiationAsk: "Make indemnity mutual, cap exposure, and exclude claims caused by the other party."
  },
  {
    category: "renewal",
    title: "Automatic renewal or cancellation trap",
    terms: ["auto-renew", "automatic renewal", "renewal", "cancel", "cancellation", "notice period"],
    severity: "medium",
    impact: "You may be locked into another term or charged fees unless you cancel inside a narrow window.",
    recommendation: "Require clear renewal notices, simple cancellation, and no penalty unless explicitly accepted.",
    negotiationAsk: "Add a reminder obligation and allow cancellation from the dashboard or written notice at any time before renewal."
  },
  {
    category: "ip",
    title: "Intellectual property ownership transfer",
    terms: ["intellectual property", "work product", "assignment", "assign", "ownership", "derivative works", "license"],
    severity: "critical",
    impact: "You may lose ownership of inventions, creative output, source code, or future derivative work.",
    recommendation: "Limit transfers to paid deliverables and preserve background IP, portfolio rights, and pre-existing materials.",
    negotiationAsk: "Clarify that only final paid deliverables transfer, while background IP and reusable know-how remain yours."
  },
  {
    category: "privacy",
    title: "Expansive data collection or sharing",
    terms: ["personal data", "privacy", "tracking", "third party", "share", "sell", "collect", "processing"],
    severity: "high",
    impact: "The counterparty may collect, retain, or share more personal or business data than needed.",
    recommendation: "Restrict data use to service delivery, require deletion rights, and demand a clear subprocessors list.",
    negotiationAsk: "Limit collection to necessary data and add deletion, audit, breach notice, and opt-out rights."
  },
  {
    category: "arbitration",
    title: "One-sided arbitration or class action waiver",
    terms: ["arbitration", "class action", "jury trial", "venue", "dispute", "waiver"],
    severity: "high",
    impact: "You may lose access to court, collective claims, or a practical venue for enforcing rights.",
    recommendation: "Make dispute procedures mutual, affordable, and located near the affected party.",
    negotiationAsk: "Preserve small-claims rights and remove one-sided venue, fee, or class action restrictions."
  },
  {
    category: "termination",
    title: "Unbalanced termination rights",
    terms: ["terminate", "termination", "for convenience", "breach", "suspend", "survive"],
    severity: "medium",
    impact: "The other side may exit or suspend service while your obligations continue after termination.",
    recommendation: "Add cure periods, mutual termination rights, refund language, and survival limits.",
    negotiationAsk: "Require notice, cure periods, refunds for unused prepaid fees, and balanced termination rights."
  },
  {
    category: "employment",
    title: "Restrictive employment covenant",
    terms: [
      "competing business",
      "outside business activity",
      "moonlighting",
      "prior written consent",
      "non-compete",
      "noncompete",
      "non-solicit",
      "exclusive employment"
    ],
    severity: "critical",
    impact: "Your future job options, side projects, clients, or income may be restricted after the relationship ends.",
    recommendation: "Narrow the restriction by geography, time, role, client list, and legitimate business interest.",
    negotiationAsk: "Remove the non-compete or limit it to direct competitors, paid garden leave, and a short duration."
  },
  {
    category: "payment",
    title: "Payment penalty or unilateral fee change",
    terms: ["late fee", "payment", "invoice", "penalty", "price change", "taxes", "charge"],
    severity: "medium",
    impact: "Costs may increase or penalties may apply without enough notice or dispute rights.",
    recommendation: "Require advance notice, dispute windows, and explicit approval for material fee increases.",
    negotiationAsk: "Add a fee-change notice period and right to terminate without penalty after an increase."
  },
  {
    category: "ambiguity",
    title: "Ambiguous drafting or broad discretion",
    terms: ["sole discretion", "reasonable", "material", "including but not limited to", "from time to time", "as determined"],
    severity: "medium",
    impact: "Broad wording can let the counterparty decide meaning later, when you have less leverage.",
    recommendation: "Define objective standards, approval rights, timelines, and examples.",
    negotiationAsk: "Replace open-ended discretion with measurable criteria and mutual approval for material changes."
  }
];

const requiredTerms: MissingTerm[] = [
  {
    term: "Governing law and venue",
    risk: "A dispute may become expensive or unpredictable if jurisdiction is missing or unfavorable.",
    suggestedQuestion: "Which law governs this agreement, and where must disputes be filed?"
  },
  {
    term: "Termination and cure period",
    risk: "You may not know how to exit, fix a breach, or recover prepaid fees.",
    suggestedQuestion: "Can either party terminate, what notice is required, and is there a cure period?"
  },
  {
    term: "Liability cap",
    risk: "Uncapped liability can create exposure that exceeds the value of the deal.",
    suggestedQuestion: "Is each party's liability capped, and what claims are excluded from that cap?"
  },
  {
    term: "Data retention and deletion",
    risk: "Sensitive data may remain with the counterparty after the relationship ends.",
    suggestedQuestion: "When can data be deleted, exported, audited, and removed from backups?"
  },
  {
    term: "Assignment and change of control",
    risk: "Your contract may be transferred to another company without your approval.",
    suggestedQuestion: "Can either party assign the agreement, and do you get notice or consent rights?"
  },
  {
    term: "Notice method",
    risk: "Deadlines can be missed if the contract does not clearly say how official notices are delivered.",
    suggestedQuestion: "What counts as valid notice, and when is notice considered received?"
  },
  {
    term: "Survival limits",
    risk: "Some obligations may continue forever after termination unless survival is limited.",
    suggestedQuestion: "Which clauses survive termination, and for how long?"
  },
  {
    term: "Data breach notification",
    risk: "You may not be told quickly if your personal or business data is exposed.",
    suggestedQuestion: "How quickly must the other side notify you after a suspected data breach?"
  }
];

export function analyzeContractDeterministically(rawText: string, fileName?: string): AnalysisReport {
  const contractText = stripExtractionMetadata(rawText);
  const normalized = normalizeContract(contractText);
  const sections = buildCoverageSections(normalized);
  const truncated = sections.length >= MAX_SECTIONS && countWords(normalized) > sections.reduce((sum, section) => sum + section.wordCount, 0);
  const analysisText = sections.map((section) => section.title + "\n" + section.notes.join("\n")).join("\n\n");
  const clauses = splitClauses(analysisText);
  const baseWarnings = collectEdgeWarnings(contractText, normalized, truncated, fileName);
  const allFindings = [
    ...buildFindings(clauses, analysisText),
    ...buildContradictionFindings(analysisText),
    ...buildAbsenceFindings(analysisText)
  ];
  const findings = allFindings.filter((finding) => finding.confidence >= MIN_VISIBLE_FINDING_CONFIDENCE);
  const missingTerms = findMissingTerms(analysisText);
  const coverageMap = enrichCoverageSections(sections, findings);
  const uncertaintyNotes = buildUncertaintyNotes(normalized, coverageMap, baseWarnings, fileName);
  const edgeWarnings = [...baseWarnings, ...uncertaintyNotes.map((note) => `${note.title}: ${note.reason}`)];
  const riskAxes = buildRiskAxes(findings, missingTerms, uncertaintyNotes);
  const riskScore = calculateRiskScore(findings, missingTerms, edgeWarnings, uncertaintyNotes);
  const scenarios = buildScenarios(findings);
  const executiveDecision = riskScore >= 76 ? "do-not-sign-yet" : riskScore >= 42 ? "negotiate-first" : "safe-to-review";

  return {
    contractType: inferContractType(analysisText, fileName),
    executiveDecision,
    riskScore,
    summary: summarizeDecision(executiveDecision, findings, missingTerms),
    inputStats: {
      words: countWords(normalized),
      clauses: clauses.length,
      sections: coverageMap.length,
      truncated
    },
    findings,
    riskAxes,
    scenarios,
    missingTerms,
    negotiationPlaybook: buildNegotiationPlaybook(findings, missingTerms),
    trustLedger: buildTrustLedger(findings, edgeWarnings, coverageMap),
    edgeWarnings,
    coverageMap,
    uncertaintyNotes,
    source: "deterministic"
  };
}

export function normalizeContract(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripExtractionMetadata(text: string) {
  return text
    .split("\n")
    .filter((line) => !/^\[Extraction (method|latency strategy|warning):/i.test(line.trim()))
    .join("\n")
    .trim();
}

function splitClauses(text: string) {
  const paragraphClauses = text
    .split(/\n\s*\n|(?=\n?\d+(?:\.\d+)*\s+[A-Z])|(?=\n?[A-Z][A-Z\s]{8,}:)/)
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 40);

  if (paragraphClauses.length > 0) {
    return paragraphClauses;
  }

  return text
    .split(/(?<=[.;])\s+/)
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 40);
}

function buildFindings(clauses: string[], fullText: string): ClauseFinding[] {
  const lowerText = fullText.toLowerCase();
  const findings = categoryRules.flatMap((rule) => {
    const matchingClause = clauses.find((clause) => rule.terms.some((term) => clause.toLowerCase().includes(term)));

    if (!matchingClause && !rule.terms.some((term) => lowerText.includes(term))) {
      return [];
    }

    const evidence = extractEvidence(matchingClause ?? fullText, rule.terms);
    const confidence = matchingClause ? 0.84 : 0.64;

    return [
      {
        id: rule.category,
        title: rule.title,
        category: rule.category,
        severity: rule.severity,
        confidence,
        evidence: trimEvidence(evidence),
        explanation: `LEXGUARD found language associated with ${rule.category.replace("-", " ")} risk and evaluated it for practical asymmetry, user exposure, and enforceability pressure.`,
        impact: rule.impact,
        recommendation: rule.recommendation,
        counterpartyArgument: "The counterparty may argue this clause is needed to control risk, standardize operations, or avoid unpredictable claims.",
        userArgument: "From your side, the clause should be narrowed to actual harm, mutual duties, clear notice, and proportional remedies.",
        negotiationAsk: rule.negotiationAsk
      }
    ];
  });

  return findings.sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity));
}

function buildCoverageSections(text: string): CoverageSection[] {
  if (!text.trim()) {
    return [];
  }

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const sections: Array<{ title: string; body: string[] }> = [];
  let current: { title: string; body: string[] } | null = null;

  for (const paragraph of paragraphs) {
    const looksLikeHeading =
      paragraph.length <= 90 &&
      (/^\d+(?:\.\d+)*\s+/.test(paragraph) || /^[A-Z][A-Z\s/&-]{5,}$/.test(paragraph));

    if (looksLikeHeading || !current) {
      if (current) sections.push(current);
      current = {
        title: looksLikeHeading ? paragraph : `Section ${sections.length + 1}`,
        body: looksLikeHeading ? [] : [paragraph]
      };
    } else {
      current.body.push(paragraph);
    }
  }

  if (current) sections.push(current);

  const expanded = sections.flatMap((section, sectionIndex) => {
    const words = section.body.join("\n\n").split(/\s+/).filter(Boolean);
    if (words.length <= SECTION_TARGET_WORDS) {
      return [
        {
          id: `section-${sectionIndex + 1}`,
          title: deriveSectionTitle(section.title, section.body.join(" ")),
          wordCount: words.length,
          riskSignalCount: 0,
          confidence: words.length < 80 ? 0.52 : 0.86,
          status: words.length < 80 ? "limited" : "reviewed",
          notes: [section.body.join("\n\n").slice(0, 5000)]
        } satisfies CoverageSection
      ];
    }

    const chunks: CoverageSection[] = [];
    const step = SECTION_TARGET_WORDS - SECTION_OVERLAP_WORDS;
    for (let start = 0; start < words.length; start += step) {
      const chunkWords = words.slice(start, start + SECTION_TARGET_WORDS);
      const hasLeftOverlap = start > 0;
      const hasRightOverlap = start + SECTION_TARGET_WORDS < words.length;
      chunks.push({
        id: `section-${sectionIndex + 1}-${chunks.length + 1}`,
        title: `${deriveSectionTitle(section.title, section.body.join(" "))} part ${chunks.length + 1}`,
        wordCount: chunkWords.length,
        riskSignalCount: 0,
        confidence: hasLeftOverlap || hasRightOverlap ? 0.88 : 0.84,
        status: "reviewed",
        notes: [chunkWords.join(" ")]
      });

      if (start + SECTION_TARGET_WORDS >= words.length) break;
    }
    return chunks;
  });

  return expanded.slice(0, MAX_SECTIONS);
}

function enrichCoverageSections(sections: CoverageSection[], findings: ClauseFinding[]): CoverageSection[] {
  return sections.map((section) => {
    const haystack = `${section.title}\n${section.notes.join("\n")}`.toLowerCase();
    const matched = findings.filter((finding) => {
      const evidenceWords = finding.evidence
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 5)
        .slice(0, 8);
      return evidenceWords.some((word) => haystack.includes(word));
    });

    const status: CoverageSection["status"] =
      section.status === "limited" || section.confidence < 0.62
        ? "limited"
        : matched.length > 0
          ? "needs-review"
          : "reviewed";

    return {
      ...section,
      riskSignalCount: matched.length,
      status,
      notes: [
        section.notes[0] ?? "",
        matched.map((finding) => finding.title).join("||"),
        ...section.notes
      ]
    };
  });
}

function deriveSectionTitle(title: string, body: string) {
  if (!/^Section \d+/.test(title)) return title;

  const normalized = body.replace(/\s+/g, " ").trim();
  const firstLine = body.split("\n")[0]?.trim() ?? "";
  if (/^[A-Z][A-Z\s&/-]{5,80}$/.test(firstLine)) return titleCase(firstLine);

  if (/invention|work product|source code|assignment/i.test(normalized)) return "Invention and IP assignment";
  if (/competing business|moonlighting|outside business/i.test(normalized)) return "Outside work and non-compete";
  if (/arbitration|jury trial|class action|venue/i.test(normalized)) return "Dispute resolution";
  if (/personal data|privacy|third-party/i.test(normalized)) return "Data handling";
  if (/terminate|suspend|sole discretion/i.test(normalized)) return "Termination rights";
  if (/indemnify|hold harmless|liabilities|damages/i.test(normalized)) return "Liability and indemnity";

  return "Main contract body";
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
}

function buildContradictionFindings(text: string): ClauseFinding[] {
  const checks = [
    {
      id: "contradiction-termination",
      termsA: /(terminate at any time|for convenience|sole discretion)/i,
      termsB: /(fixed term|non-cancellable|may not terminate|cannot terminate)/i,
      title: "Possible contradiction in termination rights",
      impact: "Different sections may describe inconsistent exit rights, which can create disputes when one side tries to leave.",
      recommendation: "Ask for one controlling termination clause and remove conflicting language."
    },
    {
      id: "contradiction-payment",
      termsA: /(non-refundable|no refund|all fees are final)/i,
      termsB: /(refund|credit|prorated|unused fees)/i,
      title: "Possible contradiction in refund/payment terms",
      impact: "The contract may promise refunds in one place and deny them elsewhere.",
      recommendation: "Clarify exactly when refunds, credits, and payment disputes are allowed."
    },
    {
      id: "contradiction-ip",
      termsA: /(assigns all|sole property|exclusive ownership)/i,
      termsB: /(retain ownership|pre-existing|background ip|personal projects)/i,
      title: "Possible contradiction in IP ownership",
      impact: "The agreement may both preserve and transfer ownership, which can create a future ownership fight.",
      recommendation: "Separate background IP, project deliverables, and future inventions in plain language."
    }
  ];

  return checks.flatMap((check) => {
    if (!check.termsA.test(text) || !check.termsB.test(text)) return [];

    return [
      {
        id: check.id,
        title: check.title,
        category: "ambiguity",
        severity: "high",
        confidence: 0.68,
        evidence: trimEvidence(extractEvidence(text, ["terminate", "refund", "ownership", "assigns"])),
        explanation: "LEXGUARD found signals that two parts of the document may point in opposite directions.",
        impact: check.impact,
        recommendation: check.recommendation,
        counterpartyArgument: "The counterparty may say the clauses can be harmonized or that one clause controls.",
        userArgument: "You should not have to guess which clause controls after a dispute starts.",
        negotiationAsk: check.recommendation
      } satisfies ClauseFinding
    ];
  });
}

function buildUncertaintyNotes(
  text: string,
  coverageMap: CoverageSection[],
  baseWarnings: string[],
  fileName?: string
): UncertaintyNote[] {
  const notes: UncertaintyNote[] = [];
  const extension = fileName?.split(".").pop()?.toLowerCase();
  const limitedSections = coverageMap.filter((section) => section.status === "limited");

  if (limitedSections.length > 0) {
    notes.push({
      title: "Some sections have limited readable context",
      reason: `${limitedSections.length} section${limitedSections.length === 1 ? "" : "s"} were short or low-signal, so clause boundaries may be incomplete.`,
      action: "Review the original pages around these sections and confirm no exhibits or definitions are missing."
    });
  }

  if (baseWarnings.length > 0) {
    notes.push({
      title: "Input quality warnings detected",
      reason: baseWarnings.join(" "),
      action: "Treat the report as a high-quality triage pass and verify flagged evidence against the source document."
    });
  }

  if (extension && ["png", "jpg", "jpeg", "webp"].includes(extension)) {
    notes.push({
      title: "OCR output can misread legal text",
      reason: "Image-based extraction may confuse punctuation, section numbers, or similar-looking words.",
      action: "Compare important evidence snippets against the original scan before relying on them."
    });
  }

  if (text.length > 0 && coverageMap.length === 0) {
    notes.push({
      title: "No reliable sections were detected",
      reason: "LEXGUARD could not form readable sections from the input.",
      action: "Upload a cleaner text export or paste the document body directly."
    });
  }

  if (/(incorporated by reference|available at|terms located at|privacy policy at|exhibit|appendix|schedule)/i.test(text)) {
    notes.push({
      title: "Referenced documents may contain hidden obligations",
      reason: "The contract appears to incorporate external policies, exhibits, schedules, or URLs.",
      action: "Upload every referenced policy, exhibit, schedule, and appendix for a complete review."
    });
  }

  return notes;
}

function buildAbsenceFindings(text: string): ClauseFinding[] {
  const absenceRules = [
    {
      id: "missing-mutuality",
      missing: !/(mutual|both parties|each party)/i.test(text),
      title: "Low mutuality signal",
      category: "ambiguity" as ClauseCategory,
      severity: "medium" as Severity,
      impact: "The agreement may describe duties mostly for one side, which can indicate unequal leverage.",
      recommendation: "Ask which obligations are mutual and which remedies apply equally to both parties.",
      negotiationAsk: "Add mutual obligations for confidentiality, dispute process, liability limits, notice, and cure rights."
    },
    {
      id: "missing-breach-notice",
      missing: !/(notice of breach|written notice|cure period|opportunity to cure)/i.test(text),
      title: "Missing breach notice and cure protection",
      category: "termination" as ClauseCategory,
      severity: "medium" as Severity,
      impact: "You may lose rights or face termination without a fair chance to fix an alleged breach.",
      recommendation: "Add written notice and a reasonable cure period before suspension, termination, or penalties.",
      negotiationAsk: "Require written breach notice and at least 10-30 days to cure before harsh remedies apply."
    },
    {
      id: "missing-audit-trail",
      missing: !/(audit|records|logs|documentation|receipts)/i.test(text),
      title: "Missing audit trail or proof process",
      category: "compliance" as ClauseCategory,
      severity: "low" as Severity,
      impact: "If there is a billing, compliance, or performance dispute, proof may be hard to establish.",
      recommendation: "Define what records must be kept and how disputes will be verified.",
      negotiationAsk: "Add access to records, logs, invoices, or audit evidence for disputed obligations."
    }
  ];

  return absenceRules.flatMap((rule) => {
    if (!rule.missing || text.length < 600) return [];

    return [
      {
        id: rule.id,
        title: rule.title,
        category: rule.category,
        severity: rule.severity,
        confidence: 0.58,
        evidence: `Missing protective language: ${rule.title}.`,
        explanation: "Absence flags highlight protections that may be missing, not just risky clauses that are present.",
        impact: rule.impact,
        recommendation: rule.recommendation,
        counterpartyArgument: "The counterparty may say the protection is unnecessary or covered by general law.",
        userArgument: "Important protections should be explicit so the user does not rely on assumptions.",
        negotiationAsk: rule.negotiationAsk
      } satisfies ClauseFinding
    ];
  });
}

function collectEdgeWarnings(rawText: string, normalized: string, truncated: boolean, fileName?: string) {
  const warnings: string[] = [];
  const extension = fileName?.split(".").pop()?.toLowerCase();

  if (!rawText.trim()) {
    warnings.push("No contract text was provided. Paste or upload readable text before relying on analysis.");
  }

  if (normalized.length < 500) {
    warnings.push("The input is short, so the report may miss clauses located in omitted pages, exhibits, or linked policies.");
  }

  if (truncated) {
    warnings.push("The contract is very long. LEXGUARD analyzed the first major portion and recommends reviewing appendices separately.");
  }

  if (extension && ["png", "jpg", "jpeg", "webp"].includes(extension)) {
    warnings.push("This text came from image OCR. Verify important evidence spans against the original image.");
  }

  if (/(scanned copy|ocr output|illegible|poor scan|image-only)/i.test(normalized)) {
    warnings.push("The contract text mentions scan or OCR quality issues. Verify important evidence spans manually.");
  }

  if (!/[.;:]/.test(normalized)) {
    warnings.push("The input has little punctuation, which can reduce clause boundary accuracy.");
  }

  return warnings;
}

function findMissingTerms(text: string) {
  const lowerText = text.toLowerCase();
  return requiredTerms.filter((item) => {
    const term = item.term.toLowerCase();
    if (term.includes("governing")) {
      return !/(governing law|jurisdiction|venue)/i.test(text);
    }
    if (term.includes("termination")) {
      return !/(termination|terminate|cure period|notice)/i.test(text);
    }
    if (term.includes("liability")) {
      return !/(liability|damages|indemn)/i.test(text);
    }
    if (term.includes("data")) {
      return !/(delete|retention|personal data|privacy|data)/i.test(lowerText);
    }
    if (term.includes("assignment")) {
      return !/(assignment|assign this agreement|change of control)/i.test(text);
    }
    if (term.includes("notice method")) {
      return !/(notice|email|registered mail|certified mail|deemed received)/i.test(text);
    }
    if (term.includes("survival")) {
      return !/(survive|survival|after termination)/i.test(text);
    }
    if (term.includes("breach")) {
      return !/(breach notification|security incident|data breach|notify.*breach)/i.test(text);
    }
    return false;
  });
}

function buildRiskAxes(
  findings: ClauseFinding[],
  missingTerms: MissingTerm[],
  uncertaintyNotes: UncertaintyNote[]
): RiskAxis[] {
  const axes = [
    { name: "Financial Exposure", categories: ["liability", "payment", "renewal"] },
    { name: "Exit Control", categories: ["termination", "renewal", "employment"] },
    { name: "Rights Transfer", categories: ["ip", "confidentiality"] },
    { name: "Dispute Leverage", categories: ["arbitration", "governing-law"] },
    { name: "Data & Privacy", categories: ["privacy", "compliance"] },
    { name: "Drafting Ambiguity", categories: ["ambiguity"] }
  ];

  return axes.map((axis) => {
    const matched = findings.filter((finding) => axis.categories.includes(finding.category));
    const score = Math.min(
      100,
      matched.reduce((sum, finding) => sum + severityWeight(finding.severity) * 18, 0) +
        missingTerms.length * 4 +
        uncertaintyNotes.length * 2
    );

    return {
      name: axis.name,
      score,
      rationale:
        matched.length > 0
          ? `${matched.length} related issue${matched.length === 1 ? "" : "s"} detected.`
          : "No strong signal detected in this pass."
    };
  });
}

function calculateRiskScore(
  findings: ClauseFinding[],
  missingTerms: MissingTerm[],
  edgeWarnings: string[],
  uncertaintyNotes: UncertaintyNote[]
) {
  const severityScore = findings.reduce((sum, finding) => sum + severityWeight(finding.severity) * 10, 0);
  const confidenceFactor = findings.length
    ? findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
    : 0.35;

  return Math.min(
    100,
    Math.round(
      severityScore * confidenceFactor + missingTerms.length * 5 + edgeWarnings.length * 2 + uncertaintyNotes.length * 4
    )
  );
}

function buildScenarios(findings: ClauseFinding[]): Scenario[] {
  const scenarios: Scenario[] = findings.slice(0, 4).map((finding) => ({
    name: scenarioName(finding.category),
    likelihood: finding.severity === "critical" ? "high" : finding.severity === "high" ? "medium" : "low",
    consequence: finding.impact,
    trigger: `Triggered by: ${finding.title}.`,
    mitigation: finding.recommendation
  }));

  if (scenarios.length === 0) {
    scenarios.push({
      name: "No obvious trap found",
      likelihood: "low",
      consequence: "The contract may still contain business risks that require human legal review.",
      trigger: "No strong keyword or structure signal was detected.",
      mitigation: "Ask for a lawyer-facing redline if the deal value or personal exposure is meaningful."
    });
  }

  return scenarios;
}

function buildNegotiationPlaybook(findings: ClauseFinding[], missingTerms: MissingTerm[]) {
  const asks = findings.slice(0, 5).map((finding) => finding.negotiationAsk);
  const missing = missingTerms.map((term) => term.suggestedQuestion);
  return [...asks, ...missing].slice(0, 7);
}

function buildTrustLedger(findings: ClauseFinding[], edgeWarnings: string[], coverageMap: CoverageSection[]) {
  const ledger = findings.slice(0, 6).map((finding) => {
    const confidence = Math.round(finding.confidence * 100);
    return `${finding.title}: ${confidence}% confidence, grounded in quoted evidence, severity ${finding.severity}.`;
  });

  const coverageSummary = `Coverage: ${coverageMap.length} section${coverageMap.length === 1 ? "" : "s"} reviewed; ${coverageMap.filter((section) => section.status === "needs-review").length} section${coverageMap.filter((section) => section.status === "needs-review").length === 1 ? "" : "s"} need review.`;

  return [coverageSummary, ...ledger, ...edgeWarnings.map((warning) => `Caution: ${warning}`)];
}

function inferContractType(text: string, fileName?: string) {
  const lowerText = `${fileName ?? ""} ${text}`.toLowerCase();
  if (/employment|employee|non-compete|salary|offer letter/.test(lowerText)) return "Employment / contractor agreement";
  if (/privacy policy|personal data|cookies|tracking/.test(lowerText)) return "Privacy policy";
  if (/rent|lease|tenant|landlord/.test(lowerText)) return "Rental / lease agreement";
  if (/subscription|saas|service level|platform/.test(lowerText)) return "SaaS / platform terms";
  if (/vendor|supplier|purchase order|statement of work/.test(lowerText)) return "Vendor / services agreement";
  return "General legal agreement";
}

function summarizeDecision(
  decision: AnalysisReport["executiveDecision"],
  findings: ClauseFinding[],
  missingTerms: MissingTerm[]
) {
  if (decision === "do-not-sign-yet") {
    return `Do not sign yet. LEXGUARD found ${findings.length} risk signals, including severe asymmetry, plus ${missingTerms.length} missing control terms.`;
  }
  if (decision === "negotiate-first") {
    return `Negotiate before signing. The contract has manageable risk if the flagged clauses are narrowed and missing terms are clarified.`;
  }
  return "No major trap was detected in this pass, but important legal commitments should still be reviewed against the full document.";
}

function extractEvidence(text: string, terms: string[]) {
  const lowerText = text.toLowerCase();
  const firstIndex = terms.map((term) => lowerText.indexOf(term.toLowerCase())).find((index) => index >= 0);

  if (firstIndex === undefined) return text.slice(0, 260);

  const sentenceStart = Math.max(
    0,
    text.lastIndexOf(".", firstIndex - 1) + 1,
    text.lastIndexOf(";", firstIndex - 1) + 1
  );
  const sentenceEndCandidates = [text.indexOf(".", firstIndex), text.indexOf(";", firstIndex)].filter((index) => index >= 0);
  const sentenceEnd = sentenceEndCandidates.length ? Math.min(...sentenceEndCandidates) + 1 : text.length;
  const sentence = text.slice(sentenceStart, sentenceEnd).trim();

  if (sentence.length >= 40 && sentence.length <= 360) {
    return sentence;
  }

  const start = Math.max(0, firstIndex - 90);
  const end = Math.min(text.length, firstIndex + 220);
  return text.slice(start, end);
}

function trimEvidence(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > 320 ? `${compact.slice(0, 320)}...` : compact;
}

function countWords(text: string) {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function severityWeight(severity: Severity) {
  return {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    info: 1
  }[severity];
}

function scenarioName(category: ClauseCategory) {
  const names: Record<ClauseCategory, string> = {
    liability: "Unexpected claim lands on you",
    termination: "Service ends while duties survive",
    renewal: "Silent renewal creates avoidable cost",
    payment: "Fees increase after dependency forms",
    privacy: "Sensitive data spreads beyond your control",
    ip: "Your work product becomes someone else's asset",
    employment: "Future job options get restricted",
    arbitration: "Dispute rights become expensive to use",
    confidentiality: "Confidentiality duties outlive practical control",
    "governing-law": "Dispute moves to an unfavorable forum",
    compliance: "Regulatory duty is shifted onto you",
    ambiguity: "Broad wording gets interpreted against you",
    general: "General legal risk emerges"
  };

  return names[category];
}
