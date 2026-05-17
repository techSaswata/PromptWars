import { ArrowRight } from "lucide-react";
import type { AnalysisReport } from "@/lib/types";

const arrowColors = [
  "text-cyan-300",
  "text-fuchsia-300",
  "text-emerald-300",
  "text-amber-300",
  "text-violet-300",
  "text-rose-300",
  "text-teal-300",
  "text-blue-300"
];

export function Playbook({ report }: { report: AnalysisReport }) {
  return (
    <div className="premium-card rounded-3xl p-5">
      <p className="text-xs uppercase tracking-[0.28em] bg-gradient-to-r from-violet-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent font-semibold">Negotiation Playbook</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Recommended asks</h2>
      <div className="mt-4 space-y-3">
        {report.negotiationPlaybook.map((ask, i) => (
          <div key={ask} className="flex gap-3 rounded-2xl border border-slate-800/60 bg-black/40 p-4 transition-all hover:border-slate-700/80">
            <ArrowRight className={`mt-0.5 shrink-0 ${arrowColors[i % arrowColors.length]}`} size={17} />
            <p className="text-sm leading-6 text-slate-300">{ask}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
