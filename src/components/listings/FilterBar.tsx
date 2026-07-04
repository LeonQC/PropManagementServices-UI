import { useEffect, useState } from "react";
import Dropdown from "./Dropdown";
import {
  METRO_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  activeChips,
  hasPriceRange,
  priceRangeLabel,
  sortLabel,
  type PropertyFilters,
} from "../../lib/filters";

interface Props {
  filters: PropertyFilters;
  onChange: (next: PropertyFilters) => void;
  sort: string;
  onSortChange: (next: string) => void;
  search: string;
  onSearchChange: (next: string) => void;
}

// Controlled filter bar. Map view stays disabled ("coming soon"); search and
// sort are now wired to the API (keyword `q` + `sort` params).
export default function FilterBar({
  filters,
  onChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
}: Props) {
  const chips = activeChips(filters);

  // Toggle a single-select dimension off when its active value is reselected.
  const toggle = (key: "propertyType" | "status", value: string) =>
    onChange({ ...filters, [key]: filters[key] === value ? undefined : value });

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        {/* Keyword search (API `q` param, debounced upstream) */}
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search properties..."
            className="w-56 rounded-full border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {TYPE_OPTIONS.map((t) => (
          <Pill key={t} active={filters.propertyType === t} onClick={() => toggle("propertyType", t)}>
            {t}
          </Pill>
        ))}

        {STATUS_OPTIONS.map((s) => (
          <Pill
            key={s.value}
            active={filters.status === s.value}
            onClick={() => toggle("status", s.value)}
          >
            {s.label}
          </Pill>
        ))}

        {/* Metro */}
        <Dropdown
          label={filters.metroArea ?? "All Markets"}
          active={!!filters.metroArea}
          panelClassName="max-h-72 w-56 overflow-y-auto"
        >
          {(close) => (
            <>
              <MenuItem
                selected={!filters.metroArea}
                onClick={() => {
                  onChange({ ...filters, metroArea: undefined });
                  close();
                }}
              >
                All Markets
              </MenuItem>
              {METRO_OPTIONS.map((m) => (
                <MenuItem
                  key={m}
                  selected={filters.metroArea === m}
                  onClick={() => {
                    onChange({ ...filters, metroArea: m });
                    close();
                  }}
                >
                  {m}
                </MenuItem>
              ))}
            </>
          )}
        </Dropdown>

        {/* Price range */}
        <Dropdown
          label={priceRangeLabel(filters.minPrice, filters.maxPrice)}
          active={hasPriceRange(filters)}
          panelClassName="w-64"
        >
          {(close) => (
            <PriceRangePanel
              min={filters.minPrice}
              max={filters.maxPrice}
              onApply={(min, max) => {
                onChange({ ...filters, minPrice: min, maxPrice: max });
                close();
              }}
            />
          )}
        </Dropdown>
      </div>

      {/* Active filters + actions */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex min-h-[1.75rem] flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange(chip.clear(filters))}
              className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand hover:bg-brand/20"
            >
              {chip.label}
              <CloseIcon />
            </button>
          ))}
          {chips.length > 0 && (
            <button
              type="button"
              onClick={() => onChange({})}
              className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Dropdown
            label={
              <span className="inline-flex items-center gap-2">
                <SortIcon />
                {`Sort: ${sortLabel(sort)}`}
              </span>
            }
            active={sort !== "newest"}
            align="right"
            panelClassName="w-52"
          >
            {(close) => (
              <>
                {SORT_OPTIONS.map((opt) => (
                  <MenuItem
                    key={opt.value}
                    selected={sort === opt.value}
                    onClick={() => {
                      onSortChange(opt.value);
                      close();
                    }}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
              </>
            )}
          </Dropdown>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-400"
          >
            <MapIcon />
            Map View
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceRangePanel({
  min,
  max,
  onApply,
}: {
  min: number | undefined;
  max: number | undefined;
  onApply: (min: number | undefined, max: number | undefined) => void;
}) {
  // Edited in millions for a friendlier scale (e.g. "1.5" = $1.5M).
  const toM = (v: number | undefined) => (v != null ? String(v / 1_000_000) : "");
  const [minM, setMinM] = useState(toM(min));
  const [maxM, setMaxM] = useState(toM(max));

  // Re-sync when the panel reopens against different applied values.
  useEffect(() => {
    setMinM(toM(min));
    setMaxM(toM(max));
  }, [min, max]);

  const parse = (s: string): number | undefined => {
    const n = parseFloat(s);
    return s.trim() !== "" && !Number.isNaN(n) && n >= 0 ? n * 1_000_000 : undefined;
  };

  return (
    <div className="p-2">
      <p className="px-1 pb-2 text-xs font-medium text-slate-500">Asking price ($M)</p>
      <div className="flex items-center gap-2">
        <PriceInput value={minM} placeholder="Min" onChange={setMinM} />
        <span className="text-slate-400">–</span>
        <PriceInput value={maxM} placeholder="Max" onChange={setMaxM} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setMinM("");
            setMaxM("");
            onApply(undefined, undefined);
          }}
          className="text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => onApply(parse(minM), parse(maxM))}
          className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function PriceInput({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
        $
      </span>
      <input
        type="number"
        min="0"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 py-1.5 pl-5 pr-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
    </div>
  );
}

function Pill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand bg-brand text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function MenuItem({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "block w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors",
        selected ? "bg-brand/10 font-medium text-brand" : "text-slate-700 hover:bg-slate-50",
      ].join(" ")}
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
function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
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
