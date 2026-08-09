import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { hitHref, searchAll, type SearchEntityType, type SearchHitResponse } from "../api/search";
import Pagination from "../components/listings/Pagination";

const PAGE_SIZE = 20;

const TABS: { label: string; value: SearchEntityType | null }[] = [
  { label: "All", value: null },
  { label: "Properties", value: "property" },
  { label: "Deals", value: "deal" },
];

// Everything, ranked together. The URL is the single source of truth for the query — the
// keyword box lives in TopNav and writes here, which keeps one search box on screen
// instead of two and makes any result set a shareable link.
export default function GlobalSearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const entityType = parseEntityType(params.get("type"));
  const [page, setPage] = useState(1);

  // A new keyword or a narrower type invalidates the current page number.
  useEffect(() => {
    setPage(1);
  }, [q, entityType]);

  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["search-all", q, entityType, page],
    queryFn: ({ signal }) => searchAll(q, entityType, page, PAGE_SIZE, signal),
    // An empty box means "no query yet", not "match everything" — /search/v1/all would
    // happily match_all, but that isn't what a blank search box is asking for.
    enabled: q !== "",
    placeholderData: keepPreviousData,
    // No retry, unlike the app-wide default. This is the one query with no Postgres
    // fallback behind it, so "search-service is down" is a state the page has to be able
    // to say out loud — and a keystroke-scoped query is superseded by the next one long
    // before a delayed retry would help. Failing fast is what surfaces the outage.
    retry: 0,
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function selectTab(value: SearchEntityType | null) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (value) next.set("type", value);
    setParams(next, { replace: true });
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Search</h1>
      <p className="mt-1 text-sm text-slate-500">{subtitle(q, isPending, isError, totalCount)}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            aria-pressed={entityType === tab.value}
            onClick={() => selectTab(tab.value)}
            className={[
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              entityType === tab.value
                ? "border-brand bg-brand text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {q === "" ? (
          <p className="mt-12 text-center text-sm text-slate-500">
            Type in the search box above to search properties and deals at once.
          </p>
        ) : isError ? (
          <div className="mt-12 text-center text-sm text-slate-500">
            Could not run the search — the search service may be unavailable.{" "}
            <button type="button" onClick={() => refetch()} className="font-medium text-brand hover:underline">
              Retry
            </button>
          </div>
        ) : isPending ? (
          // isPending, not isLoading: between a failed attempt and its retry, isFetching
          // drops to false and isLoading with it, which would flash "nothing matches" at
          // someone whose search service is merely down.
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-[4.5rem] animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-sm font-medium text-slate-700">Nothing matches “{q}”.</p>
            <p className="mt-1 text-sm text-slate-500">
              Search covers titles, descriptions, comments and document filenames.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((hit) => (
              <li key={`${hit.entityType}:${hit.id}`}>
                <ResultRow hit={hit} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}

// A hit carries only {entityType, id, title, snippet, score} — none of what PropertyCard or
// DealCard need — so results get their own compact row rather than a starved entity card.
function ResultRow({ hit }: { hit: SearchHitResponse }) {
  const isDeal = hit.entityType === "deal";
  return (
    <Link
      to={hitHref(hit)}
      className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Fixed width so the two labels don't stagger the titles down the list. */}
      <span
        className={[
          "mt-0.5 w-16 shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-medium",
          isDeal ? "bg-brand/10 text-brand-hover" : "bg-slate-100 text-slate-600",
        ].join(" ")}
      >
        {isDeal ? "Deal" : "Property"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{hit.title}</p>
        {hit.snippet && (
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{hit.snippet}</p>
        )}
      </div>
      <span
        title={`Relevance score ${hit.score}`}
        className="mt-0.5 shrink-0 text-xs tabular-nums text-slate-400"
      >
        {hit.score.toFixed(1)}
      </span>
    </Link>
  );
}

/** Anything other than the two known values is treated as no filter, so a hand-edited
 *  ?type= can't send the backend a term it will silently match nothing on. */
function parseEntityType(value: string | null): SearchEntityType | null {
  return value === "property" || value === "deal" ? value : null;
}

function subtitle(q: string, isPending: boolean, isError: boolean, totalCount: number): string {
  if (q === "") return "Properties and deals in one ranked list.";
  if (isError) return `Could not search for “${q}”`;
  if (isPending) return `Searching for “${q}”…`;
  if (totalCount === 0) return `No results for “${q}”`;
  return `${totalCount} ${totalCount === 1 ? "result" : "results"} for “${q}”, ranked by relevance`;
}
