import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { advanceDeal, getDeals, killDeal, type DealResponse } from "../api/deals";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { STAGES, nextStage } from "../lib/dealStages";
import PipelineSummaryBar from "../components/acquisitions/PipelineSummaryBar";
import StageColumn from "../components/acquisitions/StageColumn";
import KillDealModal from "../components/acquisitions/KillDealModal";
import CreateDealModal from "../components/acquisitions/CreateDealModal";

// The Kanban board (design doc §5.2): one column per stage, cards move via the
// card menu or a drag constrained to the immediately-next stage.
export default function AcquisitionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Authorization matrix §5.3: killing a deal requires Associate or above.
  const canKill = user?.role !== undefined && user.role !== "Analyst";

  const [dragging, setDragging] = useState<DealResponse | null>(null);
  const [killTarget, setKillTarget] = useState<DealResponse | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["deals", "board"],
    // The board shows the whole pipeline at once; 200 comfortably covers it.
    queryFn: ({ signal }) => getDeals(1, 200, {}, signal),
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

  const deals = data?.items ?? [];
  const byStage = new Map<string, DealResponse[]>(STAGES.map((s) => [s, []]));
  for (const deal of deals) byStage.get(deal.stage)?.push(deal);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Acquisition Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            Drag a card to its next stage, or use the card menu.
          </p>
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

      <PipelineSummaryBar />

      {banner && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {banner}
          <button type="button" onClick={() => setBanner(null)} className="font-medium hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {isError ? (
        <div className="mt-10 text-center text-sm text-slate-500">
          Could not load the pipeline.{" "}
          <button type="button" onClick={() => refetch()} className="font-medium text-brand hover:underline">
            Retry
          </button>
        </div>
      ) : isLoading ? (
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
              canKill={canKill}
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
