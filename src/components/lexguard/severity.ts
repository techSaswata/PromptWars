import type { Severity } from "@/lib/types";

export const severityClass: Record<Severity, string> = {
  critical: "border-rose-400/50 bg-rose-500/10 text-rose-100",
  high: "border-orange-400/50 bg-orange-500/10 text-orange-100",
  medium: "border-amber-400/50 bg-amber-500/10 text-amber-100",
  low: "border-cyan-400/50 bg-cyan-500/10 text-cyan-100",
  info: "border-slate-400/50 bg-slate-500/10 text-slate-100"
};

export const severityMeaning: Record<Severity, string> = {
  critical: "Do not sign until this is fixed or reviewed.",
  high: "Negotiate this before accepting the contract.",
  medium: "Clarify or narrow this term if the deal matters.",
  low: "Worth noting, but usually not a blocker.",
  info: "Context only."
};

export const severityTone: Record<Severity, string> = {
  critical: "Immediate attention",
  high: "Serious risk",
  medium: "Needs clarity",
  low: "Watch item",
  info: "Informational"
};
