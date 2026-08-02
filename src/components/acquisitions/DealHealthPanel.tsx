import type { DealResponse } from "../../api/deals";
import { flagMeta, severityBadgeClasses, sortBySeverity } from "../../lib/dealHealth";
import { isTerminal } from "../../lib/dealStages";

interface Props {
  deal: DealResponse;
}

// Deal health flags (design doc §6.6) — the deterministic half. The service
// re-evaluates these on every read, so time-based ones (stale stage, expiring LOI)
// are current without anything having to fire. Terminal deals carry no flags; the
// panel hides itself rather than showing a permanently empty card.
export default function DealHealthPanel({ deal }: Props) {
  const flags = sortBySeverity(deal.healthFlags);
  if (flags.length === 0) {
    if (isTerminal(deal.stage)) return null;
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Deal Health</h2>
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
          <span aria-hidden="true">✓</span> No health flags on this deal.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Deal Health</h2>
        <span className="text-xs text-slate-400">
          {flags.length} flag{flags.length === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {flags.map((flag) => (
          <li
            key={flag.type}
            className={`flex gap-2 rounded-lg px-3 py-2 text-sm ${severityBadgeClasses(flag.severity)}`}
          >
            <span aria-hidden="true" className="mt-px shrink-0 font-semibold">
              {flagMeta(flag.type).icon}
            </span>
            <span>
              <span className="font-semibold">{flagMeta(flag.type).label}</span>
              <span className="mt-0.5 block opacity-90">{flag.message}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
