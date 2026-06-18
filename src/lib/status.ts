// Central place mapping API enum-ish strings to display labels + Tailwind colors,
// so the palette stays consistent with the mockup across all cards.

export interface StatusMeta {
  label: string;
  dot: string; // colored dot inside the white status pill
  text: string;
}

const STATUS_META: Record<string, StatusMeta> = {
  listed: { label: "Listed", dot: "bg-emerald-500", text: "text-emerald-700" },
  under_contract: { label: "Under Contract", dot: "bg-amber-500", text: "text-amber-700" },
  off_market: { label: "Off Market", dot: "bg-slate-400", text: "text-slate-600" },
  acquired: { label: "Acquired", dot: "bg-blue-500", text: "text-blue-700" },
};

export function statusMeta(status: string): StatusMeta {
  return (
    STATUS_META[status] ?? {
      label: toTitle(status),
      dot: "bg-slate-400",
      text: "text-slate-600",
    }
  );
}

// Colored pill for the property-type badge.
const TYPE_BADGE: Record<string, string> = {
  apartment: "bg-purple-100 text-purple-700",
  "mixed-use": "bg-emerald-100 text-emerald-700",
  industrial: "bg-blue-100 text-blue-700",
  office: "bg-indigo-100 text-indigo-700",
  retail: "bg-pink-100 text-pink-700",
};

export function typeBadgeClasses(propertyType: string): string {
  return TYPE_BADGE[propertyType.toLowerCase()] ?? "bg-slate-100 text-slate-700";
}

function toTitle(s: string): string {
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
