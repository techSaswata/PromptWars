"use client";

import { useMemo, useState } from "react";
import { ContractIntake } from "@/components/lexguard/contract-intake";
import { Hero } from "@/components/lexguard/hero";
import { ReportPanel } from "@/components/lexguard/report-panel";
import type { AnalysisReport } from "@/lib/types";

export function LexguardApp() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("No file selected");
  const [report, setReport] = useState<AnalysisReport | null>(null);
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

      setReport(payload);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Analysis failed.");
    } finally {
      setLoading(false);
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
        <Hero />

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
