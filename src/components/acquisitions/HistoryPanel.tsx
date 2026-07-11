import { useQuery } from "@tanstack/react-query";
import { getDealHistory } from "../../api/deals";
import { deadReasonLabel, stageMeta } from "../../lib/dealStages";
import { formatDate } from "../../lib/format";
import { useUserDirectory } from "../../lib/useUserDirectory";

interface Props {
  dealId: string;
}

// The immutable stage-transition audit trail (architecture §2.3), newest first.
export default function HistoryPanel({ dealId }: Props) {
  const { nameOf } = useUserDirectory();
  const { data: history } = useQuery({
    queryKey: ["deal", dealId, "history"],
    queryFn: ({ signal }) => getDealHistory(dealId, signal),
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Stage History</h2>
      <ul className="mt-3 space-y-3">
        {(history ?? []).map((h) => {
          const to = stageMeta(h.toStage);
          return (
            <li key={h.id} className="flex gap-2.5">
              <span className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${to.dot}`} />
              <div>
                <p className="text-sm text-slate-700">
                  {h.fromStage ? (
                    <>
                      {stageMeta(h.fromStage).label} → <span className="font-medium">{to.label}</span>
                    </>
                  ) : (
                    <>
                      Deal created in <span className="font-medium">{to.label}</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {formatDate(h.changedAt)} · {nameOf(h.changedById)}
                  {h.daysInStage != null && ` · ${h.daysInStage}d in prior stage`}
                  {h.reason && (
                    <span className="ml-1 font-medium text-red-600">· {deadReasonLabel(h.reason)}</span>
                  )}
                </p>
              </div>
            </li>
          );
        })}
        {history && history.length === 0 && <li className="text-sm text-slate-400">No history.</li>}
      </ul>
    </section>
  );
}
