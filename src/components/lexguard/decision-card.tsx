import { Gavel } from "lucide-react";
import type { AnalysisReport } from "@/lib/types";

export function DecisionCard({ report }: { report: AnalysisReport }) {
  const scoreColor =
    report.riskScore >= 70 ? "from-rose-400 to-red-500"
    : report.riskScore >= 40 ? "from-amber-400 to-orange-500"
    : "from-emerald-400 to-teal-500";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-fuchsia-400/20 bg-gradient-to-br from-violet-500/10 via-black/80 to-cyan-500/8 p-5">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="flex items-start justify-between gap-4">
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.28em] bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent font-semibold">Decision Brief</p>
          <h2 className={`mt-3 text-4xl font-black tracking-tight bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent`}>{report.riskScore}/100</h2>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-fuchsia-200">
            {report.executiveDecision.replaceAll("-", " ")}
          </p>
        </div>
        <div className="relative rounded-2xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-500/15 to-violet-500/15 p-3 text-fuchsia-200">
          <Gavel size={22} />
        </div>
      </div>
      <p className="relative mt-4 leading-7 text-slate-300">{report.summary}</p>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Metric label="Type" value={report.contractType} />
        <Metric label="Clauses" value={String(report.inputStats.clauses)} />
        <Metric label="Source" value={report.source} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/40 p-3 transition-all hover:border-violet-400/25">
      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}
