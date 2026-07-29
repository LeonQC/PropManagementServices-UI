import { useState } from "react";
import type { DealResponse } from "../../api/deals";
import { useUserDirectory } from "../../lib/useUserDirectory";
import Modal from "../listings/Modal";

interface Props {
  deal: DealResponse;
  isPending: boolean;
  error: string | null;
  onConfirm: (newOwnerId: string) => void;
  onClose: () => void;
}

// Reassigning a deal owner is Admin/MD-only (authorization matrix); the transfer
// is recorded as a same-stage entry in the deal's history.
export default function TransferOwnershipModal({ deal, isPending, error, onConfirm, onClose }: Props) {
  const { users, nameOf } = useUserDirectory();
  const candidates = users.filter((u) => u.id !== deal.ownerId);
  const [newOwnerId, setNewOwnerId] = useState<string>(candidates[0]?.id ?? "");

  return (
    <Modal title="Transfer ownership" onClose={onClose}>
      <form
        className="px-5 py-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (newOwnerId) onConfirm(newOwnerId);
        }}
      >
        <p className="text-sm text-slate-600">
          Transfer ownership of <span className="font-semibold text-slate-900">{deal.name}</span>{" "}
          from <span className="font-semibold">{nameOf(deal.ownerId)}</span>? The transfer is
          recorded in the deal's history.
        </p>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          New owner
          <select
            value={newOwnerId}
            onChange={(e) => setNewOwnerId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            {candidates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
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
            disabled={isPending || newOwnerId === ""}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {isPending ? "Transferring…" : "Transfer ownership"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
