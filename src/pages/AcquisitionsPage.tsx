import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { advanceDeal, getDeals, killDeal, type DealResponse } from "../api/deals";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useDebounce } from "../lib/useDebounce";
import { STAGES, nextStage } from "../lib/dealStages";
import PipelineSummaryBar from "../components/acquisitions/PipelineSummaryBar";
import StageColumn from "../components/acquisitions/StageColumn";
import DealSearchResults from "../components/acquisitions/DealSearchResults";
import KillDealModal from "../components/acquisitions/KillDealModal";
import CreateDealModal from "../components/acquisitions/CreateDealModal";
// Generic page control that happens to live in the listings folder — the search view
// pages, unlike the board, which loads the whole pipeline at once.
import Pagination from "../components/listings/Pagination";

// Ranked results have no natural bound the way the board does (one pipeline, ~200 deals),
// so the search view pages instead of capping.
const SEARCH_PAGE_SIZE = 20;

// The Kanban board (design doc §5.2): one column per stage, cards move via the
// card menu or a drag constrained to the immediately-next stage.
export default function AcquisitionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Authorization matrix §5.3: killing a deal requires Associate or above AND
  // owning the deal, unless the caller is Admin/Managing Director.
  const isElevated = user?.role === "Admin" || user?.role === "Managing Director";
  const canKillDeal = (deal: DealResponse) =>
    user !== null && user.role !== "Analyst" && (deal.ownerId === user.id || isElevated);

  const [dragging, setDragging] = useState<DealResponse | null>(null);
  const [killTarget, setKillTarget] = useState<DealResponse | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchPage, setSearchPage] = useState(1);

  // Debounce the keyword so we query once typing settles, not per keystroke.
  const debouncedSearch = useDebounce(search.trim(), 300);
  const isSearching = debouncedSearch !== "";

  // A new keyword invalidates the current page — the old page number may not exist
  // in the new result set.
  useEffect(() => {
    setSearchPage(1);
  }, [debouncedSearch]);

  // Two queries rather than one parameterised by the keyword, for two reasons.
  // ["deals", "board"] is reused verbatim by DealListSidebar so board → detail
  // navigation is cache-instant; folding the keyword into that key would desync the
  // two. And leaving the board query mounted while a search runs means clearing the
  // box restores the board from cache instead of refetching the pipeline.
  const board = useQuery({
    queryKey: ["deals", "board"],
    // The board shows the whole pipeline at once; 200 comfortably covers it.
    queryFn: ({ signal }) => getDeals(1, 200, {}, signal),
  });

  // Deals take no `sort` param on either backend — ordering is implicit, newest first
  // when browsing and relevance once `q` is present — so there is nothing to switch.
  const results = useQuery({
    queryKey: ["deals", "search", debouncedSearch, searchPage],
    queryFn: ({ signal }) =>
      getDeals(searchPage, SEARCH_PAGE_SIZE, { q: debouncedSearch }, signal),
    enabled: isSearching,
    placeholderData: keepPreviousData,
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["deals"] });
    void queryClient.invalidateQueries({ queryKey: ["pipeline-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["properties"] });
  }

  function onMutationError(err: unknown, fallback: string) {
    // A 409 means the board was stale (someone else moved the deal) — refetch
    // so the card snaps to where it really is.
    if (err instanceof ApiError && err.status === 409) {
      setBanner(`${err.message} The board has been refreshed.`);
      invalidate();
    } else {
      setBanner(err instanceof ApiError ? err.message : fallback);
    }
  }

  const advance = useMutation({
    // expectedCurrentStage pins the transition to the stage the user saw.
    mutationFn: (deal: DealResponse) => advanceDeal(deal.id, deal.stage),
    onSuccess: () => {
      setBanner(null);
      invalidate();
    },
    onError: (err) => onMutationError(err, "Could not advance the deal."),
  });

  const kill = useMutation({
    mutationFn: ({ deal, reason }: { deal: DealResponse; reason: string }) =>
      killDeal(deal.id, reason, deal.stage),
    onSuccess: () => {
      setBanner(null);
      setKillTarget(null);
      invalidate();
    },
    onError: (err) => onMutationError(err, "Could not kill the deal."),
  });

  const deals = board.data?.items ?? [];
  const byStage = new Map<string, DealResponse[]>(STAGES.map((s) => [s, []]));
  for (const deal of deals) byStage.get(deal.stage)?.push(deal);

  const resultTotal = results.data?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(resultTotal / SEARCH_PAGE_SIZE));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Acquisition Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isSearching
              ? subtitle(results.isLoading ? null : resultTotal, debouncedSearch)
              : "Drag a card to its next stage, or use the card menu."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              // Not type="search": the native clear affordance would sit next to ours.
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deals..."
              className="w-64 rounded-full border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <CloseIcon />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
          >
            <span className="text-base leading-none">+</span>
            New Deal
          </button>
        </div>
      </div>

      <PipelineSummaryBar />

      {banner && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {banner}
          <button type="button" onClick={() => setBanner(null)} className="font-medium hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {isSearching ? (
        <>
          <DealSearchResults
            deals={results.data?.items ?? []}
            query={debouncedSearch}
            isLoading={results.isLoading}
            isError={results.isError}
            onRetry={() => results.refetch()}
          />
          <div className={results.isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <Pagination page={searchPage} pageCount={pageCount} onPageChange={setSearchPage} />
          </div>
        </>
      ) : board.isError ? (
        <div className="mt-10 text-center text-sm text-slate-500">
          Could not load the pipeline.{" "}
          <button type="button" onClick={() => board.refetch()} className="font-medium text-brand hover:underline">
            Retry
          </button>
        </div>
      ) : board.isLoading ? (
        <div className="mt-6 flex gap-4">
          {STAGES.map((s) => (
            <div key={s} className="h-96 w-72 shrink-0 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-1 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <StageColumn
              key={stage}
              stage={stage}
              deals={byStage.get(stage) ?? []}
              isDropTarget={dragging !== null && nextStage(dragging.stage) === stage}
              canKillDeal={canKillDeal}
              onDropDeal={() => {
                if (dragging) advance.mutate(dragging);
                setDragging(null);
              }}
              onAdvance={(deal) => advance.mutate(deal)}
              onKill={setKillTarget}
              onDragStart={setDragging}
              onDragEnd={() => setDragging(null)}
            />
          ))}
        </div>
      )}

      {killTarget && (
        <KillDealModal
          deal={killTarget}
          isPending={kill.isPending}
          error={null}
          onConfirm={(reason) => kill.mutate({ deal: killTarget, reason })}
          onClose={() => setKillTarget(null)}
        />
      )}

      {isCreateOpen && <CreateDealModal onClose={() => setIsCreateOpen(false)} />}
    </div>
  );
}

/** `null` while the first page of results is still in flight. */
function subtitle(totalCount: number | null, query: string): string {
  if (totalCount === null) return `Searching for “${query}”…`;
  if (totalCount === 0) return `No deals matching “${query}”`;
  return `${totalCount} ${totalCount === 1 ? "deal" : "deals"} matching “${query}”, ranked by relevance`;
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
