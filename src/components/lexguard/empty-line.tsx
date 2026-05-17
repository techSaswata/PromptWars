export function EmptyLine({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-slate-800/80 bg-slate-950/45 p-4 text-sm text-slate-500">
      {text}
    </p>
  );
}
