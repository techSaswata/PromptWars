import { FileText, Loader2, Upload, Zap } from "lucide-react";

type ContractIntakeProps = {
  text: string;
  fileName: string;
  wordCount: number;
  loading: boolean;
  error: string;
  onAnalyze: () => void;
  onTextChange: (text: string) => void;
  onFileRead: (file: File) => void;
};

export function ContractIntake({
  text,
  fileName,
  wordCount,
  loading,
  error,
  onAnalyze,
  onTextChange,
  onFileRead
}: ContractIntakeProps) {
  return (
    <section className="black-panel rounded-4xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] bg-linear-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">Document Intake</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Upload or paste your agreement</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Start with a sample, paste text directly, or extract from common contract file types.
          </p>
        </div>
        <div className="rounded-2xl border border-fuchsia-400/30 bg-fuchsia-400/10 p-3 text-fuchsia-200 shadow-[0_0_35px_rgba(168,85,247,0.15)]">
          <Upload size={22} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.85fr_1.35fr]">
        <label className="flex min-h-[460px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-600/40 bg-slate-950/50 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-400/50 hover:bg-fuchsia-400/5 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)]">
          <input
            className="sr-only"
            type="file"
            accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.webp,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFileRead(file);
            }}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-cyan-400 to-violet-500 text-white shadow-xl shadow-violet-950/30">
            <FileText size={28} />
          </div>
          <span className="mt-5 text-base font-semibold text-slate-100">{fileName}</span>
          <span className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            TXT, PDF, DOCX, PNG, JPG, WEBP
          </span>
          <span className="mt-5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
            Click to upload
          </span>
        </label>

        <div className="overflow-hidden rounded-3xl border border-slate-700/50 bg-black/80 shadow-inner shadow-black/60 transition-all duration-300 focus-within:border-violet-400/50 focus-within:shadow-[0_0_30px_rgba(168,85,247,0.08)]">
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Contract Text</p>
            <p className="font-mono text-xs text-fuchsia-300/70">{wordCount} words</p>
          </div>
          <textarea
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            className="soft-scrollbar min-h-[420px] w-full resize-y bg-transparent p-4 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 lg:min-h-[416px]"
            placeholder="Paste the contract, policy, lease, vendor agreement, or employment terms here..."
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{wordCount} words queued for analysis</p>
        <button
          onClick={onAnalyze}
          disabled={loading || !text.trim()}
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3 font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 data-[loading=true]:animate-pulse"
          data-loading={loading}
          style={{ animation: !loading && text.trim() ? "neon-pulse 3s ease-in-out infinite" : undefined }}
        >
          <span className="absolute inset-0 bg-linear-to-r from-emerald-500 via-cyan-500 to-violet-500 opacity-90" />
          <span className="absolute inset-0 bg-linear-to-r from-emerald-500 via-cyan-500 to-violet-500 opacity-0 blur-xl transition group-hover:opacity-60" />
          <span className="relative flex items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
            {loading ? "Analyzing..." : "Analyze Contract"}
          </span>
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-100 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
          {error}
        </div>
      ) : null}
    </section>
  );
}
