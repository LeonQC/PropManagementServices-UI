// Display formatters for property card metrics.

/** 67500000 -> "$67.5M", 950000 -> "$950K", null -> "—". */
export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 1_000_000_000) return `$${trim(value / 1_000_000_000)}B`;
  if (value >= 1_000_000) return `$${trim(value / 1_000_000)}M`;
  if (value >= 1_000) return `$${trim(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

/** A cap/occupancy rate stored as a fraction (0.048) -> "4.8%". */
export function formatRate(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

/** Whole-percent variant for occupancy (0.96 -> "96%"). */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

/** 318000 -> "318,000 SF". */
export function formatSqft(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Math.round(value).toLocaleString("en-US")} SF`;
}

/** "425 N Central Ave · Chicago, IL" from an address (missing parts dropped). */
export function formatAddress(
  street: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined
): string {
  const cityState = [city, state].filter(Boolean).join(", ");
  return [street, cityState].filter(Boolean).join(" · ");
}

function trim(n: number): string {
  // One decimal, but drop a trailing ".0" (67.0 -> "67", 67.5 -> "67.5").
  return n.toFixed(1).replace(/\.0$/, "");
}
