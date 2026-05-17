import { z } from "zod";
import { analyzeContractDeterministically } from "./analysis";
import type { AnalysisReport } from "./types";

const llmReportSchema = z.object({
  summary: z.string().min(20),
  executiveDecision: z.enum(["safe-to-review", "negotiate-first", "do-not-sign-yet"]),
  decisionDisplay: z
    .object({
      title: z.string().min(2).max(32),
      badge: z.string().min(2).max(32),
      stages: z.tuple([z.string().min(2).max(18), z.string().min(2).max(18), z.string().min(2).max(18)]),
      activeStage: z.number().int().min(0).max(2)
    })
    .optional(),
  negotiationPlaybook: z.array(z.string()).min(1),
  trustLedger: z.array(z.string()).min(1),
  findingSignals: z
    .array(
      z.object({
        id: z.string(),
        impact: z.string().min(2),
        ask: z.string().min(2),
        counter: z.string().min(2),
        position: z.string().min(2),
        confidence: z.number().min(0).max(1).optional()
      })
    )
    .optional()
});

export async function analyzeWithOptionalLlm(text: string, fileName?: string): Promise<AnalysisReport> {
  const baseline = analyzeContractDeterministically(text, fileName);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return baseline;
  }

  try {
    const enhanced = await callLlmForEnhancement(text, baseline);
    return {
      ...baseline,
      ...enhanced,
      findings: mergeFindingSignals(baseline.findings, enhanced.findingSignals),
      source: "llm-enhanced"
    };
  } catch (error) {
    return {
      ...baseline,
      edgeWarnings: [
        ...baseline.edgeWarnings,
        `LLM enhancement failed, so deterministic analysis was used. ${error instanceof Error ? error.message : "Unknown error."}`
      ]
    };
  }
}

export async function smokeTestLlm() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      message: "OPENAI_API_KEY is missing. Add it to .env.local before the live smoke test."
    };
  }

  const reply = await callOpenAi([
    {
      role: "system",
      content: "Reply with exactly one short friendly greeting."
    },
    {
      role: "user",
      content: "hi"
    }
  ]);

  return {
    ok: true,
    message: reply
  };
}

const LEXGUARD_SYSTEM_PROMPT = `You are LEXGUARD, a contract risk intelligence engine.

Operating rules:
- Use only the supplied contract text and deterministic baseline.
- Do not invent clauses, laws, jurisdictions, facts, or remedies.
- Prefer contract-specific language over generic labels.
- If the evidence is weak, lower that finding confidence and say why in the trust ledger instead of overstating certainty.
- Write for a smart non-lawyer: precise, short, practical.
- This is legal awareness, not legal advice.

Output rules:
- Return strict JSON only.
- Make every summary and label grounded in a baseline finding id or quoted evidence.
- For visual labels, use 2-4 words, 24 characters or less when possible, and make them different for each finding where possible.
- Never use generic visual labels like "Impact", "Ask", "Counter", "Position", "Risk", or "Issue".
- Keep text compact because the UI is visual-first.`;

async function callLlmForEnhancement(text: string, baseline: AnalysisReport) {
  const clippedText = text.slice(0, 32000);
  const prompt = `Run a contract-specific enhancement pass over this deterministic baseline.

Reasoning lenses to apply dynamically, only when relevant:
- obligation map: who must do what, when, and for how long
- leverage map: which side controls discretion, venue, data, money, or IP
- consequence map: realistic worst-case outcome for the affected user
- negotiation map: smallest concrete change that reduces the risk
- evidence audit: whether each conclusion is supported by quoted text

Return strict JSON matching this shape: {"summary":"...","executiveDecision":"safe-to-review|negotiate-first|do-not-sign-yet","decisionDisplay":{"title":"contract-specific 2-4 words","badge":"short action label","stages":["stage one","stage two","stage three"],"activeStage":0},"negotiationPlaybook":["..."],"trustLedger":["..."],"findingSignals":[{"id":"same finding id from baseline","impact":"2-4 words","ask":"2-4 words","counter":"2-4 words","position":"2-4 words","confidence":0.87}]}.
Keep negotiationPlaybook to at most 8 items and trustLedger to at most 10 items.
For decisionDisplay, do not use generic fixed labels. Make title, badge, and stages fit this contract's actual risks. activeStage is 0 for reviewable, 1 for negotiate-first, 2 for blocker-level.
For findingSignals, return one item per baseline finding id. Each label must be specific to that flagged clause, not generic words like Impact, Ask, Counter, or Position.
For confidence, return a decimal from 0 to 1 based on exact evidence strength, clause specificity, and ambiguity. Do not copy the baseline confidence for every finding.

Contract:
${clippedText}

Deterministic baseline:
${JSON.stringify({
    contractType: baseline.contractType,
    riskScore: baseline.riskScore,
    findings: baseline.findings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      severity: finding.severity,
      evidence: finding.evidence,
      impact: finding.impact,
      recommendation: finding.recommendation,
      counterpartyArgument: finding.counterpartyArgument,
      userArgument: finding.userArgument
    })),
    missingTerms: baseline.missingTerms,
    edgeWarnings: baseline.edgeWarnings,
    uncertaintyNotes: baseline.uncertaintyNotes,
    coverageMap: baseline.coverageMap.map((section) => ({
      title: section.title,
      status: section.status,
      riskSignalCount: section.riskSignalCount,
      confidence: section.confidence
    }))
  })}`;

  const response = await callOpenAi([
    {
      role: "system",
      content: LEXGUARD_SYSTEM_PROMPT
    },
    {
      role: "user",
      content: prompt
    }
  ]);

  const json = extractJson(response);
  const parsed = llmReportSchema.parse(JSON.parse(json));

  return {
    summary: parsed.summary,
    executiveDecision: parsed.executiveDecision,
    decisionDisplay: parsed.decisionDisplay
      ? {
          title: compactDecisionText(parsed.decisionDisplay.title),
          badge: compactDecisionText(parsed.decisionDisplay.badge),
          stages: parsed.decisionDisplay.stages.map(compactDecisionText) as [string, string, string],
          activeStage: parsed.decisionDisplay.activeStage
        }
      : undefined,
    negotiationPlaybook: parsed.negotiationPlaybook.slice(0, 8),
    trustLedger: parsed.trustLedger.slice(0, 10),
    findingSignals: parsed.findingSignals
  };
}

function mergeFindingSignals(
  findings: AnalysisReport["findings"],
  findingSignals: z.infer<typeof llmReportSchema>["findingSignals"]
) {
  if (!findingSignals?.length) return findings;

  const signalById = new Map(findingSignals.map((signal) => [signal.id, signal]));

  return findings.map((finding) => {
    const signal = signalById.get(finding.id);
    if (!signal) return finding;

    return {
      ...finding,
      confidence: typeof signal.confidence === "number" ? clampConfidence(signal.confidence) : finding.confidence,
      visualSignals: {
        impact: compactSignal(signal.impact),
        ask: compactSignal(signal.ask),
        counter: compactSignal(signal.counter),
        position: compactSignal(signal.position)
      }
    };
  });
}

function clampConfidence(value: number) {
  return Math.min(0.99, Math.max(0.01, value));
}

function compactSignal(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= 28) return compact;

  const words = compact.split(" ").slice(0, 4).join(" ");
  return words.length <= 28 ? words : `${compact.slice(0, 25).trim()}...`;
}

function compactDecisionText(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length <= 32 ? compact : `${compact.slice(0, 29).trim()}...`;
}

async function callOpenAi(messages: Array<{ role: "system" | "user"; content: string }>) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`LLM request failed with ${response.status}: ${detail.slice(0, 240)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("LLM returned an empty response");
  }

  return content;
}

function extractJson(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("{")) return trimmed;

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("LLM response did not contain JSON");
  }

  return match[0];
}
