import type { DealResponse, HealthFlagResponse } from "../../api/deals";
import { flagMeta, severityBadgeClasses, sortBySeverity } from "../../lib/dealHealth";

interface Props {
  deal: DealResponse;
}

// AI score + rationale + the AI-derived judgment flags (design doc §6.3/§6.6). The
// columns exist in the schema today; the ai-service that populates them is a later
// milestone, so the empty state is the common case for now. The deterministic
// health flags are a separate, always-populated set — see DealHealthPanel.
export default function AiScoreCard({ deal }: Props) {
  const flags = sortBySeverity(parseFlags(deal.riskFlags));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">AI Score</h2>

      {deal.aiScore == null ? (
        <p className="mt-3 text-sm text-slate-400">
          AI deal scoring is coming soon — the score, rationale and risk flags will appear here.
        </p>
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
    </section>
  );
}

// riskFlags is a JSON string column written by the (not yet built) ai-service, in
// the design doc's [{type, severity, message}] shape. Anything that doesn't parse
// to that shape is dropped rather than rendered — a half-written model response
// should not put a broken badge on the page.
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
