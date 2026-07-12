import type { DealResponse } from "../../api/deals";

interface Props {
  deal: DealResponse;
}

// AI score + rationale + risk flags (design doc §5.3). The columns exist in the
// schema today; the ai-service that populates them is a later milestone, so the
// empty state is the common case for now.
export default function AiScoreCard({ deal }: Props) {
  const flags = parseFlags(deal.riskFlags);

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
                  key={flag}
                  className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                >
                  {flag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function parseFlags(riskFlags: string | null): string[] {
  if (!riskFlags) return [];
  try {
    const parsed = JSON.parse(riskFlags);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
