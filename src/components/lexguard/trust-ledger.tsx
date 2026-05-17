import { AlertTriangle, CheckCircle2, Database, FileCheck2, Sparkles } from "lucide-react";
import type { AnalysisReport } from "@/lib/types";

export function TrustLedger({ report }: { report: AnalysisReport }) {
  const averageConfidence = report.findings.length
    ? Math.round((report.findings.reduce((sum, finding) => sum + finding.confidence, 0) / report.findings.length) * 100)
    : 0;
  const evidenceBacked = report.findings.filter((finding) => finding.evidence && !finding.evidence.startsWith("Missing")).length;
  const warnings = report.edgeWarnings.length;
  const sourceLabel = report.source === "llm-enhanced" ? "LLM enhanced" : "Rules only";

  return (
    <div className="premium-card rounded-3xl p-5">
      <p className="text-xs uppercase tracking-[0.28em] bg-linear-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent font-semibold">Evidence Check</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Why trust this report</h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <TrustMetric icon={<FileCheck2 size={18} />} label="Evidence" value={`${evidenceBacked}/${report.findings.length}`} tone="emerald" />
        <TrustMetric icon={<Sparkles size={18} />} label="Source" value={sourceLabel} tone="cyan" />
        <TrustMetric icon={<Database size={18} />} label="Avg confidence" value={`${averageConfidence}%`} tone="violet" />
        <TrustMetric icon={<AlertTriangle size={18} />} label="Warnings" value={String(warnings)} tone={warnings ? "amber" : "emerald"} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800/60 bg-black/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Report confidence</span>
          <span className="text-sm font-black text-emerald-100">{averageConfidence}%</span>
        </div>
        <ReportSpeedometer value={averageConfidence} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {report.findings.slice(0, 8).map((finding) => (
          <span
            key={finding.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100"
          >
            <CheckCircle2 size={13} />
            {finding.title}
          </span>
        ))}
      </div>

      {warnings > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {report.edgeWarnings.slice(0, 4).map((warning) => (
            <span
              key={warning}
              title={warning}
              className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100"
            >
              <AlertTriangle size={13} />
              {shorten(warning)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TrustMetric({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "emerald" | "cyan" | "violet" | "amber";
}) {
  const toneClass = {
    emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
    cyan: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100",
    violet: "border-violet-400/25 bg-violet-400/10 text-violet-100",
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-100"
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">{label}</p>
      </div>
      <p className="mt-3 truncate text-lg font-black text-white">{value}</p>
    </div>
  );
}

function shorten(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 54 ? `${compact.slice(0, 51)}...` : compact;
}

function ReportSpeedometer({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const dash = (clamped / 100) * 157;

  return (
    <div className="relative mx-auto mt-4 h-36 max-w-sm">
      <svg viewBox="0 0 160 95" className="h-full w-full overflow-visible">
        <path d="M25 78 A55 55 0 0 1 135 78" fill="none" stroke="rgba(51,65,85,0.85)" strokeWidth="14" strokeLinecap="round" />
        <path
          d="M25 78 A55 55 0 0 1 135 78"
          fill="none"
          stroke="#ef4444"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} 157`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-3xl font-black text-white">{Math.round(clamped)}%</p>
      </div>
    </div>
  );
}
