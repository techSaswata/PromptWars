"use client";

import { useMemo, useState } from "react";
import { ContractIntake } from "@/components/lexguard/contract-intake";
import { ReportPanel } from "@/components/lexguard/report-panel";
import type { AnalysisReport } from "@/lib/types";

const LOCAL_ANALYSIS_KEY = "lexguard:last-analysis";

type SavedAnalysis = {
  text: string;
  fileName: string;
  report: AnalysisReport;
};

export function LexguardApp() {
  const [initialAnalysis] = useState(readSavedAnalysis);
  const [text, setText] = useState(initialAnalysis?.text ?? "");
  const [fileName, setFileName] = useState(initialAnalysis?.fileName ?? "No file selected");
  const [report, setReport] = useState<AnalysisReport | null>(initialAnalysis?.report ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);

  async function analyze() {
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fileName })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message ?? "Analysis failed.");
      }

      const nextReport = payload as AnalysisReport;
      setReport(nextReport);
      saveAnalysis({
        text,
        fileName,
        report: nextReport
      });
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  function saveAnalysis(nextAnalysis: SavedAnalysis) {
    try {
      window.localStorage.setItem(LOCAL_ANALYSIS_KEY, JSON.stringify(nextAnalysis));
    } catch {
      // If browser storage is full or unavailable, keep the in-memory report.
    }
  }

  async function readFile(file: File) {
    setFileName(file.name);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok || !payload.text?.trim()) {
        throw new Error(payload.message ?? payload.warning ?? "Could not extract readable text.");
      }

      const extractionNotes = [
        `[Extraction method: ${payload.method ?? "unknown"}]`,
        payload.latencyStrategy ? `[Latency strategy: ${payload.latencyStrategy}]` : "",
        payload.warning ? `[Extraction warning: ${payload.warning}]` : ""
      ]
        .filter(Boolean)
        .join("\n");

      setText(`${payload.text}\n\n${extractionNotes}`.trim());
    } catch (extractError) {
      setError(extractError instanceof Error ? extractError.message : "Could not extract readable text.");
    }
  }

  return (
    <main className="risk-grid relative z-10 min-h-screen overflow-hidden px-4 py-6 text-slate-50 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.025),transparent_34rem)]" />
      <section className="relative mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-6">
          <ContractIntake
            text={text}
            fileName={fileName}
            wordCount={wordCount}
            loading={loading}
            error={error}
            onAnalyze={analyze}
            onTextChange={setText}
            onFileRead={(file) => void readFile(file)}
          />
          <ReportPanel report={report} loading={loading} />
        </div>
      </section>
    </main>
  );
}

function readSavedAnalysis() {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(LOCAL_ANALYSIS_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as Partial<SavedAnalysis>;
    if (!parsed.report || typeof parsed.text !== "string") return null;

    return {
      text: parsed.text,
      fileName: typeof parsed.fileName === "string" ? parsed.fileName : "Restored contract",
      report: parsed.report
    };
  } catch {
    window.localStorage.removeItem(LOCAL_ANALYSIS_KEY);
    return null;
  }
}
