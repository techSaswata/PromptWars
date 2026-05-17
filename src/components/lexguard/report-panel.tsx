import { Activity, Bot, FileSearch, Gauge, Radar, ShieldCheck, Sparkles } from "lucide-react";
import type { AnalysisReport } from "@/lib/types";
import { CoverageMap } from "./coverage-map";
import { DecisionCard } from "./decision-card";
import { Findings } from "./findings";
import { Playbook } from "./playbook";
import { RiskGraph } from "./risk-graph";
import { ScenarioPanel } from "./scenario-panel";
import { TrustLedger } from "./trust-ledger";

type ReportPanelProps = {
  report: AnalysisReport | null;
  loading: boolean;
};

const analysisSteps = [
  ["Extracting clauses", "Parsing obligation language and section structure", FileSearch, "from-cyan-400 to-blue-500"],
  ["Stress testing terms", "Checking non-competes, indemnity, arbitration, and IP assignment", Radar, "from-violet-400 to-fuchsia-500"],
  ["Grounding evidence", "Linking every flag to proof from the document", ShieldCheck, "from-rose-400 to-orange-500"],
  ["Drafting strategy", "Turning risk into plain-language negotiation asks", Bot, "from-emerald-400 to-teal-500"]
] as const;

export function ReportPanel({ report, loading }: ReportPanelProps) {
  if (loading) {
    return (
      <section className="black-panel relative min-h-[720px] overflow-hidden rounded-4xl p-6 sm:p-8">
        {/* Animated multicolor blurs that drift */}
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" style={{ animation: "loading-drift-1 6s ease-in-out infinite" }} />
        <div className="absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" style={{ animation: "loading-drift-2 8s ease-in-out infinite" }} />
        <div className="absolute top-1/2 right-1/3 h-48 w-48 rounded-full bg-emerald-400/12 blur-3xl" style={{ animation: "loading-drift-3 7s ease-in-out infinite" }} />
        <div className="absolute top-1/4 left-1/2 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" style={{ animation: "loading-drift-1 5s ease-in-out infinite reverse" }} />

        <div className="relative flex min-h-[660px] flex-col justify-center">
          <div className="mx-auto max-w-2xl text-center">
            {/* Animated spinning ring around the icon */}
            <div className="relative mx-auto h-28 w-28">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 112 112" style={{ animation: "spin-slow 4s linear infinite" }}>
                <defs>
                  <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00fff7" stopOpacity="0.9" />
                    <stop offset="33%" stopColor="#a855f7" stopOpacity="0.9" />
                    <stop offset="66%" stopColor="#ff00ff" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                <circle cx="56" cy="56" r="50" fill="none" stroke="url(#ring-grad)" strokeWidth="3" strokeDasharray="100 220" strokeLinecap="round" />
              </svg>
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 112 112" style={{ animation: "spin-slow 6s linear infinite reverse" }}>
                <circle cx="56" cy="56" r="44" fill="none" stroke="rgba(0,255,247,0.15)" strokeWidth="1.5" strokeDasharray="40 200" strokeLinecap="round" />
              </svg>
              <div className="pulse-orb absolute inset-3 flex items-center justify-center rounded-3xl border border-fuchsia-300/30 bg-linear-to-br from-cyan-400/20 via-violet-500/20 to-fuchsia-500/20 shadow-[0_0_70px_rgba(168,85,247,0.35)]">
                <Sparkles className="text-white" size={36} />
              </div>
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] bg-linear-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
              LEXGUARD Analysis Running
            </p>
            <h2 className="glow-text mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              Building your risk report
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-400">
              The model is scanning legal language, linking evidence, and assembling a negotiation-ready brief.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            {/* Live waveform visualizer instead of static bars */}
            <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-black/70 p-5 shadow-2xl shadow-violet-950/20">
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-fuchsia-400/80 to-transparent" />
              <div className="scan-sweep pointer-events-none absolute inset-x-0 h-28 bg-linear-to-b from-transparent via-fuchsia-400/15 to-transparent" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Neural Scanner
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-white">Live clause analysis</h3>
                </div>
                <Activity className="text-fuchsia-300 animate-pulse" size={24} />
              </div>

              {/* Audio-visualizer style waveform bars */}
              <div className="mt-6 flex items-end justify-center gap-[3px] h-32">
                {Array.from({ length: 40 }).map((_, i) => {
                  const hue = (i * 9) % 360;
                  const duration = 0.6 + ((i * 17) % 12) / 10;
                  const delay = i * 0.04;
                  return (
                    <div
                      key={i}
                      className="w-2 rounded-full"
                      style={{
                        background: `hsl(${hue}, 80%, 65%)`,
                        boxShadow: `0 0 8px hsla(${hue}, 90%, 60%, 0.4)`,
                        animation: `waveform-bar ${duration}s ease-in-out ${delay}s infinite alternate`,
                        height: "20%"
                      }}
                    />
                  );
                })}
              </div>

              {/* Live scrolling log lines */}
              <div className="mt-5 space-y-2 overflow-hidden rounded-2xl border border-slate-800/60 bg-black/50 p-3 font-mono text-[11px]">
                {[
                  { text: "→ scanning clause boundaries...", color: "text-cyan-400" },
                  { text: "→ extracting obligation patterns...", color: "text-fuchsia-400" },
                  { text: "→ matching risk signatures...", color: "text-amber-400" },
                  { text: "→ linking evidence chains...", color: "text-emerald-400" },
                  { text: "→ computing confidence scores...", color: "text-violet-400" },
                ].map((line, i) => (
                  <div
                    key={i}
                    className={`${line.color} opacity-0`}
                    style={{ animation: `log-line-appear 0.4s ease-out ${i * 0.8}s forwards, log-line-pulse 2s ease-in-out ${i * 0.8 + 0.4}s infinite` }}
                  >
                    {line.text}
                  </div>
                ))}
              </div>

              {/* Scrolling step carousel */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-black/50 py-3">
                <div className="slide-track flex w-max gap-3 px-3">
                  {[...analysisSteps, ...analysisSteps].map(([title, , Icon, gradient], index) => (
                    <div
                      key={`${title}-${index}`}
                      className="flex min-w-56 items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br ${gradient}`}>
                        <Icon className="text-white" size={15} />
                      </div>
                      <span className="text-sm font-semibold text-slate-200">{title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {analysisSteps.map(([title, detail, Icon, gradient], index) => (
                <div
                  key={title}
                  className="float-card rounded-3xl border border-slate-700/50 bg-white/3 p-4"
                  style={{ animationDelay: `${index * 0.35}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${gradient} text-white shadow-lg`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{title}</h3>
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!report) {
    return (
      <section className="black-panel flex min-h-[720px] items-center justify-center rounded-4xl p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-linear-to-br from-violet-500/20 via-fuchsia-500/15 to-cyan-500/20">
            <Gauge className="text-fuchsia-200" size={42} />
          </div>
          <h2 className="glow-text mt-6 text-2xl font-bold tracking-tight">Risk report waiting</h2>
          <p className="mt-3 text-slate-400">
            Upload or paste a contract to reveal severity, leverage, missing terms, and negotiation strategy.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="black-panel rounded-4xl p-5 sm:p-6">
      <div className="grid gap-4 xl:grid-cols-[0.75fr_1fr]">
        <DecisionCard report={report} />
        <RiskGraph axes={report.riskAxes} />
      </div>

      <div className="mt-5">
        <CoverageMap report={report} />
      </div>

      <div className="mt-5">
        <Findings findings={report.findings} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <ScenarioPanel report={report} />
        <Playbook report={report} />
      </div>

      <div className="mt-5">
        <TrustLedger report={report} />
      </div>
    </section>
  );
}
