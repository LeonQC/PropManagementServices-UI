import type { DealResponse } from "../../api/deals";
import { useUserDirectory } from "../../lib/useUserDirectory";

interface Props {
  deal: DealResponse;
  /** Authorization matrix: transferring ownership requires Admin or Managing Director. */
  canTransfer: boolean;
  onTransfer: () => void;
}

export default function OwnerPanel({ deal, canTransfer, onTransfer }: Props) {
  const { nameOf, initialsOf } = useUserDirectory();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Owner</h2>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-header text-xs font-semibold text-white">
            {initialsOf(deal.ownerId)}
          </span>
          <p className="truncate text-sm font-medium text-slate-900">{nameOf(deal.ownerId)}</p>
        </div>
        {canTransfer && (
          <button
            type="button"
            onClick={onTransfer}
            className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Transfer
          </button>
        )}
      </div>
    </section>
  );
}
