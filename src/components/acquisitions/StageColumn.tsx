import { useState } from "react";
import type { DealResponse } from "../../api/deals";
import { formatMoney } from "../../lib/format";
import { stageMeta } from "../../lib/dealStages";
import DealCard from "./DealCard";

interface Props {
  stage: string;
  deals: DealResponse[];
  /** True while a drag is active and this column is the dragged deal's next stage. */
  isDropTarget: boolean;
  canKill: boolean;
  onDropDeal: () => void;
  onAdvance: (deal: DealResponse) => void;
  onKill: (deal: DealResponse) => void;
  onDragStart: (deal: DealResponse) => void;
  onDragEnd: () => void;
}

export default function StageColumn({
  stage,
  deals,
  isDropTarget,
  canKill,
  onDropDeal,
  onAdvance,
  onKill,
  onDragStart,
  onDragEnd,
}: Props) {
  const [isOver, setIsOver] = useState(false);
  const meta = stageMeta(stage);
  const totalValue = deals.reduce((sum, d) => sum + (d.offerPrice ?? 0), 0);

  return (
    <div
      // Only the next-stage column accepts the drop: preventDefault on dragover
      // is what enables dropping, so every other column naturally rejects it.
      onDragOver={(e) => {
        if (!isDropTarget) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        if (!isDropTarget) return;
        e.preventDefault();
        setIsOver(false);
        onDropDeal();
      }}
      className={[
        "flex w-72 shrink-0 flex-col rounded-xl border bg-slate-50/80 transition-colors",
        isDropTarget
          ? isOver
            ? "border-brand bg-brand/10 ring-2 ring-brand"
            : "border-brand/50 ring-1 ring-brand/40"
          : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className={`inline-block h-2 w-2 rounded-full ${meta.dot}`} />
          {meta.label}
          <span className="rounded-full bg-white px-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
            {deals.length}
          </span>
        </span>
        <span className="text-xs text-slate-400">{totalValue > 0 ? formatMoney(totalValue) : ""}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            canKill={canKill}
            onAdvance={onAdvance}
            onKill={onKill}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {deals.length === 0 && (
          <p className="mt-4 text-center text-xs text-slate-400">
            {isDropTarget ? "Drop here to advance" : "No deals"}
          </p>
        )}
      </div>
    </div>
  );
}
