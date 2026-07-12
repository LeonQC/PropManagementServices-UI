import { useState } from "react";
import type { DealResponse } from "../../api/deals";
import { DEAD_REASONS } from "../../lib/dealStages";
import Modal from "../listings/Modal";

interface Props {
  deal: DealResponse;
  isPending: boolean;
  error: string | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

// Moving a deal to Dead requires a reason from the predefined list (design §5.2).
export default function KillDealModal({ deal, isPending, error, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState<string>(DEAD_REASONS[0].value);

  return (
    <Modal title="Kill deal" onClose={onClose}>
      <form
        className="px-5 py-4"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(reason);
        }}
      >
        <p className="text-sm text-slate-600">
          Move <span className="font-semibold text-slate-900">{deal.name}</span> to{" "}
          <span className="font-semibold">Dead</span>? The transition is recorded in the
          deal's history with the reason below.
        </p>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Reason
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            {DEAD_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Killing…" : "Kill deal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
