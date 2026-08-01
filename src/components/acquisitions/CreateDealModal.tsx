import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createDeal } from "../../api/deals";
import { getProperties } from "../../api/properties";
import type { PropertyResponse } from "../../api/types";
import { ApiError } from "../../api/client";
import { PRIORITIES } from "../../lib/dealStages";
import { formatMoney } from "../../lib/format";
import { useDebounce } from "../../lib/useDebounce";
import Modal from "../listings/Modal";

interface Props {
  /** Preselect a property (the listings "Start acquisition" path); omit for the board's picker. */
  property?: PropertyResponse;
  onClose: () => void;
}

// "Start acquisition" flow: pick (or receive) a property, tune the deal fields,
// POST /deals — the new deal lands in Initial Interest with template tasks.
export default function CreateDealModal({ property, onClose }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<PropertyResponse | null>(property ?? null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 300);

  const [name, setName] = useState("");
  const [priority, setPriority] = useState<string>("Medium");
  const [offerPrice, setOfferPrice] = useState<string>(
    property?.askingPrice != null ? String(property.askingPrice) : ""
  );
  const [capRate, setCapRate] = useState<string>(
    property?.capRate != null ? String(property.capRate) : ""
  );
  const [targetIrr, setTargetIrr] = useState("");
  const [equityMultiple, setEquityMultiple] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Property picker (only when nothing was preselected): search listed properties.
  const { data: searchResults } = useQuery({
    queryKey: ["deal-property-picker", debouncedSearch],
    queryFn: ({ signal }) =>
      getProperties(1, 6, { status: "listed" }, undefined, debouncedSearch, signal),
    enabled: !property && selected === null,
  });

  const mutation = useMutation({
    mutationFn: createDeal,
    onSuccess: (deal) => {
      void queryClient.invalidateQueries({ queryKey: ["deals"] });
      void queryClient.invalidateQueries({ queryKey: ["pipeline-summary"] });
      // Listings flips the property to under_contract via Kafka (eventually
      // consistent — a beat behind this invalidation is expected).
      void queryClient.invalidateQueries({ queryKey: ["properties"] });
      onClose();
      navigate(`/acquisitions/${deal.id}`);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not create the deal.");
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Pick a property first.");
      return;
    }
    setError(null);
    mutation.mutate({
      propertyId: selected.id,
      propertyName: selected.title,
      propertyType: selected.propertyType,
      metroArea: selected.address?.metroArea ?? null,
      // Snapshotted alongside the fields above so the deal's health flags can be
      // evaluated without a cross-service read (design doc §6.6).
      occupancyRate: selected.occupancyRate,
      marketCapRateBenchmark: selected.marketCapRateBenchmark,
      name: name.trim() || null,
      priority,
      offerPrice: offerPrice ? Number(offerPrice) : null,
      projectedCapRate: capRate ? Number(capRate) : null,
      targetIrr: targetIrr ? Number(targetIrr) : null,
      equityMultiple: equityMultiple ? Number(equityMultiple) : null,
      projectedCloseDate: closeDate || null,
    });
  }

  const input =
    "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none";
  const label = "block text-sm font-medium text-slate-700";

  return (
    <Modal title="Start acquisition" onClose={onClose}>
      <form className="px-5 py-4" onSubmit={submit}>
        {/* Property (preselected or picker) */}
        {selected ? (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{selected.title}</p>
              <p className="text-xs text-slate-500">
                {selected.propertyType}
                {selected.address?.metroArea ? ` · ${selected.address.metroArea}` : ""}
                {selected.askingPrice != null ? ` · asking ${formatMoney(selected.askingPrice)}` : ""}
              </p>
            </div>
            {!property && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-sm font-medium text-brand hover:underline"
              >
                Change
              </button>
            )}
          </div>
        ) : (
          <div>
            <label className={label}>
              Property
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search listed properties…"
                className={input}
              />
            </label>
            <ul className="mt-2 max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {(searchResults?.items ?? []).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(p);
                      if (p.askingPrice != null) setOfferPrice(String(p.askingPrice));
                      if (p.capRate != null) setCapRate(String(p.capRate));
                    }}
                    className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-900">{p.title}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      {p.propertyType}
                      {p.address?.metroArea ? ` · ${p.address.metroArea}` : ""}
                    </span>
                  </button>
                </li>
              ))}
              {searchResults && searchResults.items.length === 0 && (
                <li className="px-3 py-2 text-sm text-slate-500">No listed properties match.</li>
              )}
            </ul>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className={`${label} col-span-2`}>
            Deal name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selected ? `${selected.title} Acquisition` : "Defaults to property name"}
              className={input}
            />
          </label>
          <label className={label}>
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={input}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className={label}>
            Offer price ($)
            <input type="number" min="0" step="any" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className={input} />
          </label>
          <label className={label}>
            Projected cap rate
            <input type="number" min="0" step="any" placeholder="0.065" value={capRate} onChange={(e) => setCapRate(e.target.value)} className={input} />
          </label>
          <label className={label}>
            Target IRR
            <input type="number" min="0" step="any" placeholder="0.15" value={targetIrr} onChange={(e) => setTargetIrr(e.target.value)} className={input} />
          </label>
          <label className={label}>
            Equity multiple
            <input type="number" min="0" step="any" placeholder="1.8" value={equityMultiple} onChange={(e) => setEquityMultiple(e.target.value)} className={input} />
          </label>
          <label className={label}>
            Projected close date
            <input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} className={input} />
          </label>
        </div>

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
            disabled={mutation.isPending || !selected}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {mutation.isPending ? "Creating…" : "Create deal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
