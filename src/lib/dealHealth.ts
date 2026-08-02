// Presentation for the deterministic deal health flags (design doc §6.6). The
// backend computes them on every read and ships {type, severity, message}; this
// file only decides how they look. Flag types must match DealHealth.Evaluate in
// DealsService.DataAccess.

import type { HealthFlagResponse } from "../api/deals";

interface FlagMeta {
  /** Badge text on a Kanban card — kept to two words so cards stay readable. */
  label: string;
  /** Single glyph for the compact card indicator. */
  icon: string;
}

export const HEALTH_FLAG_META: Record<string, FlagMeta> = {
  stale_stage: { label: "Stale", icon: "⏳" },
  overdue_tasks: { label: "Overdue", icon: "!" },
  expiring_loi: { label: "LOI expiring", icon: "⏰" },
  cap_rate_compression: { label: "Cap compression", icon: "↓" },
  low_occupancy: { label: "Low occupancy", icon: "◑" },
};

/** Unknown types still render — the backend may add flags before the UI knows them. */
export function flagMeta(type: string): FlagMeta {
  return HEALTH_FLAG_META[type] ?? { label: type.replace(/_/g, " "), icon: "•" };
}

/** Critical reads red, warning amber. Matches the severities the service emits. */
export function severityBadgeClasses(severity: string): string {
  return severity === "critical"
    ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
    : "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200";
}

/** Critical first, so the two badges a card has room for are the ones that matter. */
export function sortBySeverity(flags: HealthFlagResponse[]): HealthFlagResponse[] {
  return [...flags].sort((a, b) => Number(b.severity === "critical") - Number(a.severity === "critical"));
}
