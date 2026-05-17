import { Gavel } from "lucide-react";
import type { AnalysisReport } from "@/lib/types";

export function DecisionCard({ report }: { report: AnalysisReport }) {
  const decision = getDecisionCopy(report);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-fuchsia-400/20 bg-linear-to-br from-violet-500/10 via-black/80 to-cyan-500/8 p-5">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="flex items-start justify-between gap-4">
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.28em] bg-linear-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent font-semibold">Risk Decision</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-white">{decision.title}</h2>
          <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${decision.className}`}>
            {decision.badge}
          </p>
        </div>
        <div className="relative rounded-2xl border border-fuchsia-400/25 bg-linear-to-br from-fuchsia-500/15 to-violet-500/15 p-3 text-fuchsia-200">
          <Gavel size={22} />
        </div>
      </div>
      <div className="relative mt-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-800/70 bg-black/35">
        {decision.stages.map((label, index) => (
          <div
            key={label}
            className={`p-3 text-center text-xs font-bold uppercase tracking-[0.14em] ${
              index <= decision.level ? decision.segmentClassName : "text-slate-600"
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      <p className="relative mt-4 leading-7 text-slate-300">{report.summary}</p>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Metric label="Type" value={report.contractType} />
        <Metric label="Risk index" value={String(report.riskScore)} />
        <Metric label="Source" value={report.source} />
      </div>
    </div>
  );
}

function getDecisionCopy(report: AnalysisReport) {
  const level = report.decisionDisplay?.activeStage ?? getFallbackLevel(report.executiveDecision);
  const tone = getTone(level);

  if (report.decisionDisplay) {
    return {
      title: report.decisionDisplay.title,
      badge: report.decisionDisplay.badge,
      stages: report.decisionDisplay.stages,
      level,
      ...tone
    };
  }

  if (report.executiveDecision === "do-not-sign-yet") {
    return {
      title: report.executiveDecision.replaceAll("-", " "),
      badge: "Do not sign yet",
      stages: ["Review", "Negotiate", "Blocker"] as [string, string, string],
      level,
      ...tone
    };
  }

  if (report.executiveDecision === "negotiate-first") {
    return {
      title: report.executiveDecision.replaceAll("-", " "),
      badge: "Review terms",
      stages: ["Review", "Negotiate", "Blocker"] as [string, string, string],
      level,
      ...tone
    };
  }

  return {
    title: report.executiveDecision.replaceAll("-", " "),
    badge: "Lower risk",
    stages: ["Review", "Negotiate", "Blocker"] as [string, string, string],
    level,
    ...tone
  };
}

function getFallbackLevel(decision: AnalysisReport["executiveDecision"]) {
  if (decision === "do-not-sign-yet") return 2;
  if (decision === "negotiate-first") return 1;
  return 0;
}

function getTone(level: number) {
  if (level >= 2) {
    return {
      className: "border-rose-400/40 bg-rose-500/10 text-rose-100",
      segmentClassName: "bg-rose-500/15 text-rose-100"
    };
  }
  if (level === 1) {
    return {
      className: "border-amber-400/40 bg-amber-500/10 text-amber-100",
      segmentClassName: "bg-amber-500/15 text-amber-100"
    };
  }
  return {
    className: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
    segmentClassName: "bg-emerald-500/15 text-emerald-100"
  };
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/40 p-3 transition-all hover:border-violet-400/25">
      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}
