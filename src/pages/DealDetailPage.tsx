import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { advanceDeal, getDeal, killDeal, type DealResponse } from "../api/deals";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { deadReasonLabel, isTerminal, nextStage, priorityBadgeClasses, stageMeta, ACTIVE_SEQUENCE } from "../lib/dealStages";
import { formatDate, formatMoney } from "../lib/format";
import { typeBadgeClasses } from "../lib/status";
import { useUserDirectory } from "../lib/useUserDirectory";
import DealListSidebar from "../components/acquisitions/DealListSidebar";
import TasksPanel from "../components/acquisitions/TasksPanel";
import CommentsFeed from "../components/acquisitions/CommentsFeed";
import FinancialsPanel from "../components/acquisitions/FinancialsPanel";
import DocumentsPanel from "../components/acquisitions/DocumentsPanel";
import AiScoreCard from "../components/acquisitions/AiScoreCard";
import HistoryPanel from "../components/acquisitions/HistoryPanel";
import KillDealModal from "../components/acquisitions/KillDealModal";

// The deal detail panel (design doc §3.3/§5.3): sidebar deal list, header with
// stage progress + actions, tasks/comments left, financials/docs/AI/history right.
export default function DealDetailPage() {
  const { dealId = "" } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { nameOf } = useUserDirectory();
  const canKill = user?.role !== undefined && user.role !== "Analyst";

  const [isKillOpen, setIsKillOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const { data: deal, isLoading, isError } = useQuery({
    queryKey: ["deal", dealId],
    queryFn: ({ signal }) => getDeal(dealId, signal),
    enabled: dealId.length > 0,
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
    void queryClient.invalidateQueries({ queryKey: ["deals"] });
    void queryClient.invalidateQueries({ queryKey: ["pipeline-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["properties"] });
  }

  function onMutationError(err: unknown, fallback: string) {
    setBanner(err instanceof ApiError ? err.message : fallback);
    if (err instanceof ApiError && err.status === 409) invalidate();
  }

  const advance = useMutation({
    mutationFn: (d: DealResponse) => advanceDeal(d.id, d.stage),
    onSuccess: () => {
      setBanner(null);
      invalidate();
    },
    onError: (err) => onMutationError(err, "Could not advance the deal."),
  });

  const kill = useMutation({
    mutationFn: ({ d, reason }: { d: DealResponse; reason: string }) => killDeal(d.id, reason, d.stage),
    onSuccess: () => {
      setBanner(null);
      setIsKillOpen(false);
      invalidate();
    },
    onError: (err) => onMutationError(err, "Could not kill the deal."),
  });

  if (isLoading) {
    return <div className="mt-10 animate-pulse text-center text-sm text-slate-400">Loading deal…</div>;
  }
  if (isError || !deal) {
    return <div className="mt-10 text-center text-sm text-slate-500">Deal not found.</div>;
  }

  const meta = stageMeta(deal.stage);
  const next = nextStage(deal.stage);

  return (
    <div className="flex gap-6">
      <DealListSidebar activeDealId={deal.id} />

      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{deal.name}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}>{meta.label}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityBadgeClasses(deal.priority)}`}>
                  {deal.priority}
                </span>
                {deal.propertyType && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeClasses(deal.propertyType)}`}>
                    {deal.propertyType}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {deal.propertyName}
                {deal.metroArea ? ` · ${deal.metroArea}` : ""} · Owner{" "}
                <span className="font-medium text-slate-700">{nameOf(deal.ownerId)}</span>
                {deal.projectedCloseDate && ` · Closing ${formatDate(deal.projectedCloseDate)}`}
                {deal.offerPrice != null && ` · ${formatMoney(deal.offerPrice)}`}
              </p>
              {deal.stage === "Dead" && (
                <p className="mt-1 text-sm font-medium text-red-600">
                  Dead — {deadReasonLabel(deal.deadReason)}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {next && (
                <button
                  type="button"
                  disabled={advance.isPending}
                  onClick={() => advance.mutate(deal)}
                  className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
                >
                  {advance.isPending ? "Advancing…" : `Advance to ${stageMeta(next).label}`}
                </button>
              )}
              {canKill && !isTerminal(deal.stage) && (
                <button
                  type="button"
                  onClick={() => setIsKillOpen(true)}
                  className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Kill deal
                </button>
              )}
            </div>
          </div>

          {/* Stage progress strip */}
          <ol className="mt-4 flex items-center gap-1">
            {ACTIVE_SEQUENCE.map((stage, i) => {
              const activeIdx = ACTIVE_SEQUENCE.indexOf(deal.stage as (typeof ACTIVE_SEQUENCE)[number]);
              const reached = deal.stage === "Dead" ? false : i <= activeIdx;
              return (
                <li key={stage} className="flex flex-1 items-center gap-1" title={stageMeta(stage).label}>
                  <span
                    className={`h-1.5 w-full rounded-full ${reached ? "bg-brand" : "bg-slate-200"}`}
                  />
                </li>
              );
            })}
          </ol>
        </div>

        {banner && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {banner}
            <button type="button" onClick={() => setBanner(null)} className="font-medium hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Two-column body */}
        <div className="mt-5 grid gap-5 xl:grid-cols-5">
          <div className="space-y-5 xl:col-span-3">
            <TasksPanel dealId={deal.id} />
            <CommentsFeed dealId={deal.id} />
          </div>
          <div className="space-y-5 xl:col-span-2">
            <FinancialsPanel deal={deal} />
            <AiScoreCard deal={deal} />
            <DocumentsPanel dealId={deal.id} />
            <HistoryPanel dealId={deal.id} />
          </div>
        </div>
      </div>

      {isKillOpen && (
        <KillDealModal
          deal={deal}
          isPending={kill.isPending}
          error={null}
          onConfirm={(reason) => kill.mutate({ d: deal, reason })}
          onClose={() => setIsKillOpen(false)}
        />
      )}
    </div>
  );
}
