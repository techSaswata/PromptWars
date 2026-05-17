import type { RiskAxis } from "@/lib/types";

const barColors = [
  "from-cyan-400 via-blue-400 to-violet-400",
  "from-fuchsia-400 via-pink-400 to-rose-400",
  "from-emerald-400 via-teal-400 to-cyan-400",
  "from-amber-400 via-orange-400 to-rose-400",
  "from-violet-400 via-purple-400 to-fuchsia-400",
  "from-rose-400 via-red-400 to-orange-400",
  "from-teal-400 via-emerald-400 to-green-400",
  "from-blue-400 via-indigo-400 to-violet-400"
];

const glowColors = [
  "rgba(0,255,247,0.25)",
  "rgba(255,0,255,0.25)",
  "rgba(16,185,129,0.25)",
  "rgba(245,158,11,0.25)",
  "rgba(168,85,247,0.25)",
  "rgba(244,63,94,0.25)",
  "rgba(20,184,166,0.25)",
  "rgba(59,130,246,0.25)"
];

export function RiskGraph({ axes }: { axes: RiskAxis[] }) {
  const total = axes.reduce((sum, axis) => sum + axis.score, 0) || 1;
  const primaryAxis = axes.reduce<RiskAxis | null>(
    (highest, axis) => (!highest || axis.score > highest.score ? axis : highest),
    null
  );
  const segments = axes
    .reduce<{ cumulative: number; segments: string[] }>(
      (state, axis, index) => {
        const value = Math.max(axis.score, 0);
        const start = (state.cumulative / total) * 100;
        const nextCumulative = state.cumulative + value;
        const end = (nextCumulative / total) * 100;

        return {
          cumulative: nextCumulative,
          segments: [...state.segments, `${pieColors[index % pieColors.length]} ${start}% ${end}%`]
        };
      },
      { cumulative: 0, segments: [] }
    )
    .segments;

  return (
    <div className="premium-card rounded-3xl p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] bg-linear-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent font-semibold">Risk Graph</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Exposure by category</h2>
        </div>
        <p className="text-sm text-slate-500">0-100 scale</p>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[17rem_1fr]">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800/70 bg-black/35 p-5">
          <div
            className="relative flex h-52 w-52 items-center justify-center rounded-full shadow-[0_0_45px_rgba(168,85,247,0.16)]"
            style={{ background: `conic-gradient(${segments.join(", ")})` }}
          >
            <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border border-slate-800 bg-slate-950 text-center">
              <span className="text-4xl font-black text-white">{primaryAxis?.score ?? 0}</span>
              <span className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {primaryAxis ? primaryAxis.name : "no risk"}
              </span>
            </div>
          </div>
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            {axes.slice(0, 6).map((axis, index) => (
              <div key={axis.name} className="flex items-center gap-2 text-xs text-slate-400">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: pieColors[index % pieColors.length] }}
                />
                <span className="truncate">{axis.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {axes.map((axis, i) => (
            <div key={axis.name}>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-200">{axis.name}</span>
                <span className="font-semibold text-fuchsia-200">{axis.score}</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-900">
                <div
                  className={`h-full rounded-full bg-linear-to-r ${barColors[i % barColors.length]} transition-all duration-700`}
                  style={{
                    width: `${axis.score}%`,
                    boxShadow: `0 0 18px ${glowColors[i % glowColors.length]}`
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">{axis.rationale}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const pieColors = ["#22d3ee", "#a855f7", "#f472b6", "#fb7185", "#f59e0b", "#34d399", "#60a5fa", "#c084fc"];
