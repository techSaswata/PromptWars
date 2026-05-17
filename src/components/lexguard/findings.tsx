import { AlertTriangle, ArrowUpRight, BriefcaseBusiness, Gauge, Quote, Scale, ShieldCheck, Target } from "lucide-react";
import type { ClauseFinding } from "@/lib/types";
import { EmptyLine } from "./empty-line";
import { severityClass } from "./severity";

export function Findings({ findings }: { findings: ClauseFinding[] }) {
  return (
    <div className="premium-card rounded-3xl p-5 xl:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] bg-linear-to-r from-rose-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent font-semibold">Detailed Flags</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Flagged contract text</h2>
        </div>
        <VisualLegend />
      </div>

      <div className="mt-5 grid gap-4">
        {findings.length === 0 ? (
          <EmptyLine text="No major issue detected in deterministic pass." />
        ) : (
          findings.map((finding, index) => <FindingCard key={finding.id} finding={finding} index={index} />)
        )}
      </div>
    </div>
  );
}

function FindingCard({ finding, index }: { finding: ClauseFinding; index: number }) {
  const confidence = Math.round(finding.confidence * 100);
  const severityScore = getSeverityScore(finding.severity);
  const signals = finding.visualSignals;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-800/70 bg-black/50">
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_18rem]">
        <div className="rounded-2xl border border-slate-800/70 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Quote size={17} className="text-fuchsia-300" />
            <p className="text-sm font-semibold">Flag {index + 1}</p>
          </div>
          <blockquote className="mt-3 border-l-2 border-fuchsia-400/50 pl-3 text-base leading-7 text-slate-100">
            {finding.evidence}
          </blockquote>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Risk</span>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${severityClass[finding.severity]}`}>
                {finding.severity}
              </span>
            </div>
            <SpeedometerGauge value={severityScore} tone="risk" />
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Confidence</span>
              <span className="text-sm font-black text-fuchsia-100">{confidence}%</span>
            </div>
            <SpeedometerGauge value={confidence} tone="confidence" />
          </div>
        </div>
      </div>

      {signals ? (
        <div className="grid grid-cols-2 gap-3 border-t border-slate-800/60 p-5 sm:grid-cols-4">
          <VisualSignal icon={<AlertTriangle size={20} />} label={signals.impact} tone="rose" active={severityScore >= 50} />
          <VisualSignal icon={<Target size={20} />} label={signals.ask} tone="cyan" active />
          <VisualSignal icon={<BriefcaseBusiness size={20} />} label={signals.counter} tone="amber" active />
          <VisualSignal icon={<ShieldCheck size={20} />} label={signals.position} tone="emerald" active />
        </div>
      ) : null}
    </article>
  );
}

function VisualLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      <LegendChip icon={<Gauge size={14} />} text="Risk" />
      <LegendChip icon={<ArrowUpRight size={14} />} text="Confidence" />
      <LegendChip icon={<Scale size={14} />} text="Signals" />
    </div>
  );
}

function LegendChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/70 bg-black/40 px-3 py-1 text-xs font-semibold text-slate-300">
      {icon}
      {text}
    </span>
  );
}

function VisualSignal({
  icon,
  label,
  tone,
  active
}: {
  icon: React.ReactNode;
  label: string;
  tone: "rose" | "cyan" | "amber" | "emerald";
  active: boolean;
}) {
  const toneClass = {
    rose: "border-rose-400/30 bg-rose-500/10 text-rose-200",
    cyan: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 text-center ${toneClass} ${active ? "opacity-100" : "opacity-35"}`}>
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-black/30">
        {icon}
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em]">{label}</p>
    </div>
  );
}

function getSeverityScore(severity: ClauseFinding["severity"]) {
  return {
    critical: 100,
    high: 82,
    medium: 58,
    low: 32,
    info: 18
  }[severity];
}

function SpeedometerGauge({ value }: { value: number; tone: "risk" | "confidence" }) {
  const clamped = Math.min(100, Math.max(0, value));
  const dash = (clamped / 100) * 126;

  return (
    <div className="relative mt-3 h-24">
      <svg viewBox="0 0 120 70" className="h-full w-full overflow-visible">
        <path d="M18 58 A42 42 0 0 1 102 58" fill="none" stroke="rgba(51,65,85,0.85)" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M18 58 A42 42 0 0 1 102 58"
          fill="none"
          stroke="#ef4444"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} 126`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center text-xl font-black text-white">{Math.round(clamped)}%</div>
    </div>
  );
}
