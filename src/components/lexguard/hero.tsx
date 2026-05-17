import { BrainCircuit, CheckCircle2, Lock, Radar, Scale, ShieldAlert } from "lucide-react";

const featureCards = [
  ["Clause intelligence", BrainCircuit, "from-cyan-400 to-blue-500"],
  ["Negotiation strategy", Scale, "from-violet-400 to-fuchsia-500"],
  ["Risk scoring", Radar, "from-rose-400 to-orange-500"],
  ["Evidence ledger", Lock, "from-emerald-400 to-teal-500"]
] as const;

const stats = [
  ["4-step", "legal risk workflow", "text-cyan-300"],
  ["OCR", "PDF, DOCX, images", "text-fuchsia-300"],
  ["100pt", "decision score", "text-emerald-300"]
] as const;

export function Hero() {
  return (
    <section className="black-panel relative overflow-hidden rounded-4xl p-6 sm:p-8 lg:p-10">
      {/* Multicolor floating orbs */}
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-fuchsia-500/7 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-cyan-400/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-0 h-48 w-48 rounded-full bg-emerald-400/4 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-10 right-1/4 h-40 w-40 rounded-full bg-rose-500/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />

      <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-100 shadow-[0_0_35px_rgba(168,85,247,0.2)]">
            <ShieldAlert size={14} />
            AI Rights Intelligence
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-[-0.055em] text-white sm:text-7xl lg:text-8xl">
            Legal risk, translated.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            LEXGUARD reads contracts like a practical reviewer: it extracts the risky clauses, explains the leverage,
            and turns dense legal language into a clear action plan.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.1)]">
              <CheckCircle2 size={17} />
              Private review workspace
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {stats.map(([value, label, color]) => (
              <div key={label} className="group rounded-2xl border border-white/8 bg-white/4 p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/8">
                <p className={`text-2xl font-black tracking-tight ${color}`}>{value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-lg">
          {featureCards.map(([label, Icon, gradient]) => (
            <div key={label} className="group premium-card rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br ${gradient} text-white shadow-lg`}>
                <Icon size={20} />
              </div>
              <p className="mt-4 font-semibold text-slate-100 group-hover:text-white transition-colors">{label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500 group-hover:text-slate-400 transition-colors">Built for fast review, not legal guesswork.</p>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
