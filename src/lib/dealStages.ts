// Deal pipeline constants. The stage strings are the cross-stack contract —
// they must match DealsService.Business.Domain.DealStages verbatim (DB = wire = UI).

export const STAGES = [
  "InitialInterest",
  "NdaLoi",
  "UnderwritingReview",
  "InvestmentCommittee",
  "Acquired",
  "Dead",
] as const;

export type DealStage = (typeof STAGES)[number];

/** Stages a deal advances through in order (Dead is a side exit, never advanced into). */
export const ACTIVE_SEQUENCE: DealStage[] = [
  "InitialInterest",
  "NdaLoi",
  "UnderwritingReview",
  "InvestmentCommittee",
  "Acquired",
];

export interface StageMeta {
  label: string;
  /** Column header accent + card stage badge classes. */
  badge: string;
  dot: string;
}

export const STAGE_META: Record<DealStage, StageMeta> = {
  InitialInterest: { label: "Initial Interest", badge: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  NdaLoi: { label: "NDA / LOI", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  UnderwritingReview: { label: "Underwriting Review", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  InvestmentCommittee: { label: "Investment Committee", badge: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  Acquired: { label: "Acquired", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Dead: { label: "Dead", badge: "bg-slate-200 text-slate-600", dot: "bg-slate-400" },
};

export function stageMeta(stage: string): StageMeta {
  return STAGE_META[stage as DealStage] ?? { label: stage, badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
}

/** The next stage in sequence, or null when terminal/unknown. */
export function nextStage(stage: string): DealStage | null {
  const i = ACTIVE_SEQUENCE.indexOf(stage as DealStage);
  return i >= 0 && i < ACTIVE_SEQUENCE.length - 1 ? ACTIVE_SEQUENCE[i + 1] : null;
}

export function isTerminal(stage: string): boolean {
  return stage === "Acquired" || stage === "Dead";
}

// Mirrors DealsService.Business.Domain.DeadReasons.
export const DEAD_REASONS = [
  { value: "PricingGap", label: "Pricing gap" },
  { value: "FailedDueDiligence", label: "Failed due diligence" },
  { value: "FinancingFellThrough", label: "Financing fell through" },
  { value: "SellerWithdrew", label: "Seller withdrew" },
  { value: "BetterDealFound", label: "Better deal found" },
] as const;

export function deadReasonLabel(value: string | null | undefined): string {
  return DEAD_REASONS.find((r) => r.value === value)?.label ?? value ?? "—";
}

// Mirrors DealsService.Business.Domain.DealPriorities.
export const PRIORITIES = ["Low", "Medium", "High"] as const;
export type DealPriority = (typeof PRIORITIES)[number];

export const PRIORITY_BADGE: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-red-100 text-red-700",
};

export function priorityBadgeClasses(priority: string): string {
  return PRIORITY_BADGE[priority] ?? "bg-slate-100 text-slate-600";
}
