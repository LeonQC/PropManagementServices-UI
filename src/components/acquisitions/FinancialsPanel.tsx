import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDeal, type DealResponse } from "../../api/deals";

interface Props {
  deal: DealResponse;
}

// Editable financial fields feeding the (future) AI score (design doc §5.3).
// Values are edited locally and saved in one PUT.
export default function FinancialsPanel({ deal }: Props) {
  const queryClient = useQueryClient();
  const [offerPrice, setOfferPrice] = useState(numToStr(deal.offerPrice));
  const [capRate, setCapRate] = useState(numToStr(deal.projectedCapRate));
  const [targetIrr, setTargetIrr] = useState(numToStr(deal.targetIrr));
  const [equityMultiple, setEquityMultiple] = useState(numToStr(deal.equityMultiple));
  const [closeDate, setCloseDate] = useState(deal.projectedCloseDate ?? "");

  // Re-sync when another mutation (advance/kill) refreshes the deal.
  useEffect(() => {
    setOfferPrice(numToStr(deal.offerPrice));
    setCapRate(numToStr(deal.projectedCapRate));
    setTargetIrr(numToStr(deal.targetIrr));
    setEquityMultiple(numToStr(deal.equityMultiple));
    setCloseDate(deal.projectedCloseDate ?? "");
  }, [deal]);

  const dirty =
    offerPrice !== numToStr(deal.offerPrice) ||
    capRate !== numToStr(deal.projectedCapRate) ||
    targetIrr !== numToStr(deal.targetIrr) ||
    equityMultiple !== numToStr(deal.equityMultiple) ||
    closeDate !== (deal.projectedCloseDate ?? "");

  const save = useMutation({
    mutationFn: () =>
      updateDeal(deal.id, {
        offerPrice: offerPrice ? Number(offerPrice) : null,
        projectedCapRate: capRate ? Number(capRate) : null,
        targetIrr: targetIrr ? Number(targetIrr) : null,
        equityMultiple: equityMultiple ? Number(equityMultiple) : null,
        projectedCloseDate: closeDate || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deal", deal.id] });
      void queryClient.invalidateQueries({ queryKey: ["deals"] });
      void queryClient.invalidateQueries({ queryKey: ["pipeline-summary"] });
    },
  });

  const input =
    "mt-0.5 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand focus:outline-none";
  const label = "block text-xs font-medium text-slate-500";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Financials</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className={label}>
          Offer price ($)
          <input type="number" min="0" step="any" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className={input} />
        </label>
        <label className={label}>
          Projected cap rate
          <input type="number" min="0" step="any" value={capRate} onChange={(e) => setCapRate(e.target.value)} className={input} />
        </label>
        <label className={label}>
          Target IRR
          <input type="number" min="0" step="any" value={targetIrr} onChange={(e) => setTargetIrr(e.target.value)} className={input} />
        </label>
        <label className={label}>
          Equity multiple
          <input type="number" min="0" step="any" value={equityMultiple} onChange={(e) => setEquityMultiple(e.target.value)} className={input} />
        </label>
        <label className={`${label} col-span-2`}>
          Projected close date
          <input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} className={input} />
        </label>
      </div>
      {dirty && (
        <button
          type="button"
          disabled={save.isPending}
          onClick={() => save.mutate()}
          className="mt-3 w-full rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </button>
      )}
    </section>
  );
}

function numToStr(n: number | null): string {
  return n == null ? "" : String(n);
}
