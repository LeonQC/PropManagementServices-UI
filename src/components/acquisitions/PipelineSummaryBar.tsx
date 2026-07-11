import { useQuery } from "@tanstack/react-query";
import { getPipelineSummary } from "../../api/deals";
import { formatMoney } from "../../lib/format";
import { stageMeta } from "../../lib/dealStages";

// Summary pills above the board: total active deals, aggregate pipeline value,
// and a per-stage count strip (design doc §3.1).
export default function PipelineSummaryBar() {
  const { data } = useQuery({
    queryKey: ["pipeline-summary"],
    queryFn: ({ signal }) => getPipelineSummary(signal),
  });

  if (!data) {
    return (
      <div className="mt-4 flex gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 w-36 animate-pulse rounded-full bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Pill>
        <span className="font-semibold text-slate-900">{data.totalActiveDeals}</span>
        <span className="text-slate-500">active deals</span>
      </Pill>
      <Pill>
        <span className="font-semibold text-slate-900">{formatMoney(data.totalPipelineValue)}</span>
        <span className="text-slate-500">in pipeline</span>
      </Pill>
      <div className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
      {data.stages.map((s) => {
        const meta = stageMeta(s.stage);
        return (
          <Pill key={s.stage}>
            <span className={`inline-block h-2 w-2 rounded-full ${meta.dot}`} />
            <span className="text-slate-600">{meta.label}</span>
            <span className="font-semibold text-slate-900">{s.count}</span>
          </Pill>
        );
      })}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm">
      {children}
    </span>
  );
}
