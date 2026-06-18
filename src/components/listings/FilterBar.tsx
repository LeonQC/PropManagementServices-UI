// Visual placeholder. Matches the mockup chrome but is intentionally inert in the
// MVP — the API already supports propertyType/status/metroArea/min-max price, so
// wiring these later is additive. Everything here is disabled.

const TYPE_FILTERS = ["Industrial", "Office", "Retail", "Apartment", "Mixed-Use"];
const STATUS_FILTERS = ["Listed", "Under Contract", "Off Market", "Acquired"];

export default function FilterBar() {
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search (placeholder) */}
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            disabled
            placeholder="Search properties..."
            title="Coming soon"
            className="w-64 cursor-not-allowed rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-500 placeholder:text-slate-400"
          />
        </div>

        {TYPE_FILTERS.map((f) => (
          <Pill key={f}>{f}</Pill>
        ))}
        {STATUS_FILTERS.map((f) => (
          <Pill key={f}>{f}</Pill>
        ))}

        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex cursor-not-allowed items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-500"
        >
          All Markets
          <ChevronIcon />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-500"
        >
          <SortIcon />
          Price: High → Low
          <ChevronIcon />
        </button>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-500"
        >
          <MapIcon />
          Map View
        </button>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled
      title="Coming soon"
      className="cursor-not-allowed rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600"
    >
      {children}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6-6 2v14l6-2 6 2 6-2V6l-6 2-6-2Z" />
      <path d="M9 6v14M15 8v14" />
    </svg>
  );
}
