import { AlertTriangle, CheckCircle2, Eye, HelpCircle } from "lucide-react";
import type { AnalysisReport, CoverageSection } from "@/lib/types";

const statusCopy: Record<CoverageSection["status"], { label: string; className: string }> = {
  reviewed: {
    label: "Reviewed",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
  },
  "needs-review": {
    label: "Needs review",
    className: "border-amber-400/30 bg-amber-400/10 text-amber-200"
  },
  limited: {
    label: "Limited",
    className: "border-rose-400/30 bg-rose-400/10 text-rose-200"
  }
};

export function CoverageMap({ report }: { report: AnalysisReport }) {
  const reviewed = report.coverageMap.filter((s) => s.status === "reviewed").length;
  const needsReview = report.coverageMap.filter((s) => s.status === "needs-review").length;
  const limited = report.coverageMap.filter((s) => s.status === "limited").length;

  return (
    <section className="premium-card rounded-3xl p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] bg-linear-to-r from-emerald-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent font-semibold">Coverage Map</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Proof that sections were reviewed</h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-slate-400">
          LEXGUARD highlights uncertainty instead of silently treating unclear sections as safe.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <CoverageMetric icon={<CheckCircle2 size={18} />} label="Reviewed" value={reviewed} color="text-emerald-300" />
        <CoverageMetric icon={<Eye size={18} />} label="Need human review" value={needsReview} color="text-amber-300" />
        <CoverageMetric icon={<HelpCircle size={18} />} label="Limited confidence" value={limited} color="text-rose-300" />
      </div>

      <div className="soft-scrollbar mt-5 grid max-h-[440px] gap-3 overflow-auto pr-1">
        {report.coverageMap.map((section) => {
          const status = statusCopy[section.status];
          const preview = section.notes[0];
          const linkedFlags = section.notes[1]?.split("||").filter(Boolean) ?? [];
          return (
            <article key={section.id} className="rounded-2xl border border-slate-800/60 bg-black/40 p-4 transition-all hover:border-slate-700/80">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-white">{section.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {section.wordCount} words · {section.riskSignalCount} linked risk signal
                    {section.riskSignalCount === 1 ? "" : "s"} · {Math.round(section.confidence * 100)}% coverage confidence
                  </p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                  {status.label}
                </span>
              </div>
              {preview ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{preview}</p> : null}
              {linkedFlags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {linkedFlags.slice(0, 6).map((flag) => (
                    <span
                      key={flag}
                      className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-100"
                    >
                      {flag}
                    </span>
                  ))}
                  {linkedFlags.length > 6 ? (
                    <span className="rounded-full border border-slate-700 bg-black/40 px-2.5 py-1 text-xs text-slate-400">
                      +{linkedFlags.length - 6} more
                    </span>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {report.uncertaintyNotes.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/8 p-4">
          <div className="flex items-center gap-2 text-amber-200">
            <AlertTriangle size={17} />
            <p className="font-semibold">Uncertainty that needs attention</p>
          </div>
          <div className="mt-3 space-y-3">
            {report.uncertaintyNotes.map((note) => (
              <div key={note.title} className="rounded-xl border border-amber-300/15 bg-black/40 p-3">
                <p className="text-sm font-semibold text-white">{note.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{note.reason}</p>
                <p className="mt-2 text-sm leading-6 text-amber-100">
                  <span className="font-semibold">Next step: </span>
                  {note.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CoverageMetric({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-black/40 p-4">
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <p className="text-sm font-semibold">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}
