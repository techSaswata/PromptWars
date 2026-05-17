import { createHash } from "crypto";
import type { AnalysisReport } from "./types";
import { createSupabaseServerClient } from "./supabase";

export type PersistenceResult =
  | {
      saved: true;
      analysisId: string;
    }
  | {
      saved: false;
      reason: string;
    };

export async function persistAnalysisReport({
  report,
  text,
  fileName
}: {
  report: AnalysisReport;
  text: string;
  fileName?: string;
}): Promise<PersistenceResult> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return {
      saved: false,
      reason: "Supabase env vars are missing."
    };
  }
  const db = supabase;

  const { data: analysis, error: analysisError } = await db
    .from("analyses_lexguard")
    .insert({
      file_name: fileName ?? null,
      contract_type: report.contractType,
      executive_decision: report.executiveDecision,
      risk_score: report.riskScore,
      summary: report.summary,
      source: report.source,
      word_count: report.inputStats.words,
      clause_count: report.inputStats.clauses,
      truncated: report.inputStats.truncated,
      text_fingerprint: fingerprintText(text),
      metadata: {
        storedFullText: false,
        reason: "LEXGUARD stores report intelligence and a text fingerprint, not raw contract text.",
        coverageMap: report.coverageMap,
        uncertaintyNotes: report.uncertaintyNotes
      }
    })
    .select("id")
    .single();

  if (analysisError || !analysis) {
    return {
      saved: false,
      reason: analysisError?.message ?? "Failed to create analysis row."
    };
  }

  const analysisId = analysis.id as string;
  const childWrites = [
    insertRows(
      "findings_lexguard",
      report.findings.map((finding) => ({
        analysis_id: analysisId,
        finding_key: finding.id,
        title: finding.title,
        category: finding.category,
        severity: finding.severity,
        confidence: finding.confidence,
        evidence: finding.evidence,
        explanation: finding.explanation,
        impact: finding.impact,
        recommendation: finding.recommendation,
        counterparty_argument: finding.counterpartyArgument,
        user_argument: finding.userArgument,
        negotiation_ask: finding.negotiationAsk
      }))
    ),
    insertRows(
      "risk_axes_lexguard",
      report.riskAxes.map((axis) => ({
        analysis_id: analysisId,
        name: axis.name,
        score: axis.score,
        rationale: axis.rationale
      }))
    ),
    insertRows(
      "scenarios_lexguard",
      report.scenarios.map((scenario) => ({
        analysis_id: analysisId,
        name: scenario.name,
        likelihood: scenario.likelihood,
        consequence: scenario.consequence,
        trigger: scenario.trigger,
        mitigation: scenario.mitigation
      }))
    ),
    insertRows(
      "missing_terms_lexguard",
      report.missingTerms.map((term) => ({
        analysis_id: analysisId,
        term: term.term,
        risk: term.risk,
        suggested_question: term.suggestedQuestion
      }))
    ),
    insertRows(
      "playbook_items_lexguard",
      report.negotiationPlaybook.map((item, position) => ({
        analysis_id: analysisId,
        position,
        item
      }))
    ),
    insertRows(
      "trust_ledger_items_lexguard",
      report.trustLedger.map((item, position) => ({
        analysis_id: analysisId,
        position,
        item
      }))
    ),
    insertRows(
      "edge_warnings_lexguard",
      report.edgeWarnings.map((warning, position) => ({
        analysis_id: analysisId,
        position,
        warning
      }))
    )
  ];

  const results = await Promise.all(childWrites);
  const failedWrite = results.find((result) => result);

  if (failedWrite) {
    return {
      saved: false,
      reason: `Analysis row saved, but a child table insert failed: ${failedWrite}`
    };
  }

  return {
    saved: true,
    analysisId
  };

  async function insertRows(table: string, rows: Array<Record<string, unknown>>) {
    if (rows.length === 0) return null;

    const { error } = await db.from(table).insert(rows);
    return error?.message ?? null;
  }
}

function fingerprintText(text: string) {
  return createHash("sha256").update(text).digest("hex");
}
