// Listings filter model + option lists. The listings API supports single-value
// equality filters (propertyType/status/metroArea) plus a price range
// (minPrice/maxPrice), so the UI is single-select per dimension. Option values
// mirror exactly what the service stores (see seed-data.sql).

import { formatMoney } from "./format";

export interface PropertyFilters {
  propertyType?: string;
  status?: string;
  metroArea?: string;
  minPrice?: number;
  maxPrice?: number;
}

export const EMPTY_FILTERS: PropertyFilters = {};

// propertyType is stored capitalized; value === label.
export const TYPE_OPTIONS = [
  "Industrial",
  "Office",
  "Retail",
  "Apartment",
  "Mixed-Use",
] as const;

// status is stored lowercase. off_market is hidden server-side, so it's omitted
// (selecting it would always yield zero results).
export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "listed", label: "Listed" },
  { value: "under_contract", label: "Under Contract" },
  { value: "acquired", label: "Acquired" },
];

// metroArea is stored as "<City> Metro"; value === label.
export const METRO_OPTIONS = [
  "Atlanta Metro",
  "Austin Metro",
  "Baltimore Metro",
  "Charlotte Metro",
  "Chicago Metro",
  "Columbus Metro",
  "Dallas Metro",
  "Denver Metro",
  "Indianapolis Metro",
  "Kansas City Metro",
  "Los Angeles Metro",
  "Miami Metro",
  "Minneapolis Metro",
  "Nashville Metro",
  "New York Metro",
  "Phoenix Metro",
  "Pittsburgh Metro",
  "Portland Metro",
  "Seattle Metro",
  "Tampa Metro",
] as const;

// Sort encodes field + direction in one value, matching the API's `sort` param.
// "newest" is the server default, so the UI omits it from the request.
export const DEFAULT_SORT = "newest";

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "cap_desc", label: "Cap Rate: High → Low" },
];

export function statusLabel(value: string): string {
  return STATUS_OPTIONS.find((s) => s.value === value)?.label ?? value;
}

export function sortLabel(value: string): string {
  return SORT_OPTIONS.find((s) => s.value === value)?.label ?? "Newest";
}

/** Human label for the price range trigger/chip. */
export function priceRangeLabel(
  min: number | undefined,
  max: number | undefined
): string {
  if (min != null && max != null) return `${formatMoney(min)} – ${formatMoney(max)}`;
  if (min != null) return `≥ ${formatMoney(min)}`;
  if (max != null) return `≤ ${formatMoney(max)}`;
  return "Price";
}

export function hasPriceRange(f: PropertyFilters): boolean {
  return f.minPrice != null || f.maxPrice != null;
}

/** Number of active filter dimensions (price counts as one). */
export function activeFilterCount(f: PropertyFilters): number {
  let n = 0;
  if (f.propertyType) n++;
  if (f.status) n++;
  if (f.metroArea) n++;
  if (hasPriceRange(f)) n++;
  return n;
}

export interface ActiveChip {
  key: string;
  label: string;
  /** Returns the filters with this dimension cleared. */
  clear: (f: PropertyFilters) => PropertyFilters;
}

/** Removable chips describing the currently active filters. */
export function activeChips(f: PropertyFilters): ActiveChip[] {
  const chips: ActiveChip[] = [];
  if (f.propertyType) {
    chips.push({
      key: "propertyType",
      label: f.propertyType,
      clear: (x) => ({ ...x, propertyType: undefined }),
    });
  }
  if (f.status) {
    chips.push({
      key: "status",
      label: statusLabel(f.status),
      clear: (x) => ({ ...x, status: undefined }),
    });
  }
  if (f.metroArea) {
    chips.push({
      key: "metroArea",
      label: f.metroArea,
      clear: (x) => ({ ...x, metroArea: undefined }),
    });
  }
  if (hasPriceRange(f)) {
    chips.push({
      key: "price",
      label: priceRangeLabel(f.minPrice, f.maxPrice),
      clear: (x) => ({ ...x, minPrice: undefined, maxPrice: undefined }),
    });
  }
  return chips;
}
