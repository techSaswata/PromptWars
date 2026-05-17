import { AlertTriangle } from "lucide-react";
import type { AnalysisReport } from "@/lib/types";
import { EmptyLine } from "./empty-line";

export function ScenarioPanel({ report }: { report: AnalysisReport }) {
  return (
    <div className="premium-card rounded-3xl p-5">
      <p className="text-xs uppercase tracking-[0.28em] bg-gradient-to-r from-amber-300 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent font-semibold">What Could Go Wrong</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Scenario planning</h2>
      <div className="mt-4 space-y-3">
        {report.scenarios.map((scenario) => (
          <div key={scenario.name} className="rounded-2xl border border-slate-800/60 bg-black/40 p-4 transition-all hover:border-slate-700/80">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-white">{scenario.name}</h3>
              <span className="rounded-full bg-amber-400/10 border border-amber-400/25 px-2.5 py-1 text-xs text-amber-200 font-semibold">
                {scenario.likelihood} likelihood
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{scenario.consequence}</p>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <p className="rounded-xl border border-slate-800/60 bg-black/30 p-3 text-slate-400">
                <span className="font-semibold text-slate-200">Trigger: </span>
                {scenario.trigger}
              </p>
              <p className="rounded-xl border border-cyan-400/20 bg-cyan-400/8 p-3 text-cyan-100">
                <span className="font-semibold">Protect yourself: </span>
                {scenario.mitigation}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/8 p-4">
        <div className="flex items-center gap-2 text-rose-200">
          <AlertTriangle size={17} />
          <span className="font-semibold">Missing Terms Watch</span>
        </div>
        <div className="mt-3 space-y-2">
          {report.missingTerms.length === 0 ? (
            <EmptyLine text="No required control term is obviously missing." />
          ) : (
            report.missingTerms.map((term) => (
              <div key={term.term} className="rounded-xl border border-rose-300/15 bg-black/40 p-3">
                <p className="text-sm font-semibold text-white">{term.term}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{term.risk}</p>
                <p className="mt-2 text-sm leading-6 text-rose-100">
                  <span className="font-semibold">Ask this: </span>
                  {term.suggestedQuestion}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
