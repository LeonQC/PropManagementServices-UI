import { Link } from "react-router-dom";
import type { DealResponse } from "../../api/deals";
import { formatMoney } from "../../lib/format";
import { typeBadgeClasses } from "../../lib/status";
import { priorityBadgeClasses, stageMeta } from "../../lib/dealStages";
import { flagMeta, severityBadgeClasses, sortBySeverity } from "../../lib/dealHealth";
import { useUserDirectory } from "../../lib/useUserDirectory";

interface Props {
  deals: DealResponse[];
  query: string;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

// What the board turns into while a keyword is active. Ranked results are ordered by
// relevance, which cuts across stages, so bucketing them back into columns would scatter
// the ranking over six lists and leave most of them empty. A flat list keeps the order
// the backend chose; each row carries the stage badge the column used to convey.
//
// Navigate-only, deliberately: advance and kill are stage transitions, and they belong on
// the board where the stage you're moving from and to is visible.
export default function DealSearchResults({ deals, query, isPending, isError, onRetry }: Props) {
  const { nameOf, initialsOf } = useUserDirectory();

  if (isError) {
    return (
      <div className="mt-10 text-center text-sm text-slate-500">
        Could not run the search.{" "}
        <button type="button" onClick={onRetry} className="font-medium text-brand hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="mt-6 space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-[4.5rem] animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="mt-12 text-center">
        <p className="text-sm font-medium text-slate-700">No deals match “{query}”.</p>
        <p className="mt-1 text-sm text-slate-500">
          Search covers deal and property names, comment bodies, and document filenames.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {deals.map((deal) => {
        const meta = stageMeta(deal.stage);
        const flags = sortBySeverity(deal.healthFlags);
        return (
          <li key={deal.id}>
            <Link
              to={`/acquisitions/${deal.id}`}
              className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                  <p className="truncate text-sm font-semibold text-slate-900">{deal.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>
                <p className="mt-0.5 truncate pl-4 text-xs text-slate-500">
                  {deal.propertyName}
                  {deal.metroArea ? ` · ${deal.metroArea}` : ""}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-4">
                  {deal.propertyType && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${typeBadgeClasses(deal.propertyType)}`}>
                      {deal.propertyType}
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityBadgeClasses(deal.priority)}`}>
                    {deal.priority}
                  </span>
                  {flags.map((flag) => (
                    <span
                      key={flag.type}
                      title={flag.message}
                      className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${severityBadgeClasses(flag.severity)}`}
                    >
                      <span aria-hidden="true" className="mr-1">
                        {flagMeta(flag.type).icon}
                      </span>
                      {flagMeta(flag.type).label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4 text-xs text-slate-500">
                <span className="text-sm font-medium text-slate-700">{formatMoney(deal.offerPrice)}</span>
                <span title="Tasks complete">
                  {deal.doneTaskCount}/{deal.taskCount}
                </span>
                <span
                  title={nameOf(deal.ownerId)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-header text-[10px] font-semibold text-white"
                >
                  {initialsOf(deal.ownerId)}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
