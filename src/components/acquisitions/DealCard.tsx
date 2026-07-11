import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DealResponse } from "../../api/deals";
import { formatMoney } from "../../lib/format";
import { typeBadgeClasses } from "../../lib/status";
import { nextStage, priorityBadgeClasses, stageMeta } from "../../lib/dealStages";
import { useUserDirectory } from "../../lib/useUserDirectory";

interface Props {
  deal: DealResponse;
  canKill: boolean;
  onAdvance: (deal: DealResponse) => void;
  onKill: (deal: DealResponse) => void;
  onDragStart: (deal: DealResponse) => void;
  onDragEnd: () => void;
}

export default function DealCard({ deal, canKill, onAdvance, onKill, onDragStart, onDragEnd }: Props) {
  const navigate = useNavigate();
  const { nameOf, initialsOf } = useUserDirectory();
  const next = nextStage(deal.stage);
  const draggable = next !== null;

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", deal.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(deal);
      }}
      onDragEnd={onDragEnd}
      onClick={() => navigate(`/acquisitions/${deal.id}`)}
      className={[
        "group rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md",
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug text-slate-900">{deal.name}</p>
        <CardMenu
          canAdvance={next !== null}
          nextLabel={next ? stageMeta(next).label : null}
          canKill={canKill && !["Acquired", "Dead"].includes(deal.stage)}
          onAdvance={() => onAdvance(deal)}
          onKill={() => onKill(deal)}
          onView={() => navigate(`/acquisitions/${deal.id}`)}
        />
      </div>

      <p className="mt-0.5 truncate text-xs text-slate-500">
        {deal.propertyName}
        {deal.metroArea ? ` · ${deal.metroArea}` : ""}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {deal.propertyType && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${typeBadgeClasses(deal.propertyType)}`}>
            {deal.propertyType}
          </span>
        )}
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityBadgeClasses(deal.priority)}`}>
          {deal.priority}
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-700">{formatMoney(deal.offerPrice)}</span>
        <span className="flex items-center gap-2">
          {deal.hasOverdueTasks && (
            <span title="Has overdue tasks" className="inline-block h-2 w-2 rounded-full bg-red-500" />
          )}
          <span title="Tasks complete">
            {deal.doneTaskCount}/{deal.taskCount}
          </span>
          <span
            title={nameOf(deal.ownerId)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-header text-[10px] font-semibold text-white"
          >
            {initialsOf(deal.ownerId)}
          </span>
        </span>
      </div>
    </div>
  );
}

interface MenuProps {
  canAdvance: boolean;
  nextLabel: string | null;
  canKill: boolean;
  onAdvance: () => void;
  onKill: () => void;
  onView: () => void;
}

// Small "⋯" popover menu; stops click propagation so opening it doesn't
// navigate to the deal detail page.
function CardMenu({ canAdvance, nextLabel, canKill, onAdvance, onKill, onView }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const item = "block w-full rounded px-3 py-1.5 text-left text-sm hover:bg-slate-50";

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Deal actions"
        onClick={() => setOpen((o) => !o)}
        className="rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 focus:opacity-100 group-hover:opacity-100"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {canAdvance && (
            <button type="button" className={`${item} text-slate-700`} onClick={() => { setOpen(false); onAdvance(); }}>
              Advance to {nextLabel}
            </button>
          )}
          <button type="button" className={`${item} text-slate-700`} onClick={() => { setOpen(false); onView(); }}>
            View details
          </button>
          {canKill && (
            <button type="button" className={`${item} text-red-600`} onClick={() => { setOpen(false); onKill(); }}>
              Kill deal…
            </button>
          )}
        </div>
      )}
    </div>
  );
}
