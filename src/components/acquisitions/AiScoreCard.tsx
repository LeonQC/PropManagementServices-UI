import type { DealResponse, HealthFlagResponse } from "../../api/deals";
import { flagMeta, severityBadgeClasses, sortBySeverity } from "../../lib/dealHealth";
import { SCORE_COMPONENTS, unscoredReason } from "../../lib/dealScoring";

interface Props {
  deal: DealResponse;
}

// Deal score + rationale + the AI-derived judgment flags (design doc §6.3/§6.6).
//
// Only two of those three involve a model, and the score is not one of them. It is a fixed
// formula that deals-service evaluates on every read, so it is always current — including the
// part that moves with time, which is why it is derived rather than stored. Most deals carry
// one; a missing score always has a specific cause, which unscoredReason names rather than
// leaving the reader to guess.
//
// The rationale prose is written by a model and arrives asynchronously, so it may lag the
// number briefly. The judgment flags are unpopulated until that slice lands. The deterministic
// health flags are a separate, always-populated set; see DealHealthPanel.
export default function AiScoreCard({ deal }: Props) {
  const flags = sortBySeverity(parseFlags(deal.riskFlags));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">AI Score</h2>

      {deal.aiScore == null ? (
        <UnscoredNote deal={deal} />
      ) : (
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{deal.aiScore.toFixed(0)}</span>
            <span className="text-sm text-slate-400">/ 100</span>
          </div>
          {deal.aiScoreRationale && (
            <p className="mt-2 text-sm text-slate-600">{deal.aiScoreRationale}</p>
          )}
          {flags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {flags.map((flag) => (
                <span
                  key={flag.type}
                  title={flag.message}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityBadgeClasses(flag.severity)}`}
                >
                  {flagMeta(flag.type).label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <HowItIsCalculated />
    </section>
  );
}

/** Says why this particular deal has no number, instead of a generic placeholder. */
function UnscoredNote({ deal }: Props) {
  const reason = unscoredReason(deal);

  if (reason.kind === "terminal") {
    return (
      <p className="mt-3 text-sm text-slate-400">
        {reason.stageLabel} deals are not scored.
      </p>
    );
  }

  if (reason.kind === "no-financials") {
    // "Any one of" rather than listing them as requirements: a single financial input is
    // enough for the formula, and implying all four are needed would send people hunting
    // for numbers they don't have.
    return (
      <p className="mt-3 text-sm text-slate-400">
        Not enough financial data to score. Any one of {joinOr(reason.missing)} will produce a
        score.
      </p>
    );
  }

  return (
    <p className="mt-3 text-sm text-slate-400">
      No score yet. Scoring runs in the background and usually lands within a few seconds of a
      change.
    </p>
  );
}

/** "a, b or c" — reads as a sentence rather than as a comma-separated dump. */
function joinOr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}

/**
 * Collapsed by default. The score is a single opaque number, and the first question anyone
 * asks about one is what went into it — but that answer is reference material, not something
 * to read on every visit, so it stays behind a disclosure rather than taking up the panel.
 */
function HowItIsCalculated() {
  return (
    <details className="group mt-4 border-t border-slate-100 pt-3">
      <summary className="cursor-pointer list-none text-xs font-medium text-slate-500 hover:text-slate-700">
        <span className="inline-block transition-transform group-open:rotate-90">›</span> How this
        is calculated
      </summary>

      <div className="mt-3 space-y-3">
        <p className="text-xs leading-relaxed text-slate-500">
          A fixed formula over the deal's own numbers, not a model judgement. The same inputs
          always produce the same score.
        </p>

        <ul className="space-y-2">
          {SCORE_COMPONENTS.map((component) => (
            <li key={component.label} className="text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-slate-700">{component.label}</span>
                <span className="shrink-0 tabular-nums text-slate-400">{component.weight}%</span>
              </div>
              <p className="mt-0.5 leading-relaxed text-slate-500">{component.range}</p>
            </li>
          ))}
        </ul>

        <p className="text-xs leading-relaxed text-slate-500">
          Weights are shared out across whichever inputs the deal actually has, so a partly
          filled deal is scored on what it has rather than penalised for blank fields. A deal
          with no financial inputs at all is left unscored.
        </p>
      </div>
    </details>
  );
}

// riskFlags is a JSON string column holding the model-written judgment flags described in
// §6.6, in the [{type, severity, message}] shape. Nothing writes it yet — that slice is still
// to come — so this returns an empty list today. Anything that doesn't parse to the expected
// shape is dropped rather than rendered: a half-written model response should not put a broken
// badge on the page.
function parseFlags(riskFlags: string | null): HealthFlagResponse[] {
  if (!riskFlags) return [];
  try {
    const parsed: unknown = JSON.parse(riskFlags);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (f): f is HealthFlagResponse =>
        typeof f === "object" &&
        f !== null &&
        typeof (f as HealthFlagResponse).type === "string" &&
        typeof (f as HealthFlagResponse).message === "string"
    );
  } catch {
    return [];
  }
}
