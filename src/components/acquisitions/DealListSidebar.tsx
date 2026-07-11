import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDeals } from "../../api/deals";
import { stageMeta } from "../../lib/dealStages";

interface Props {
  activeDealId: string;
}

// Narrow deal list for quick switching (design doc §3.3), sharing the board's
// query cache so navigating board → detail is instant.
export default function DealListSidebar({ activeDealId }: Props) {
  const { data } = useQuery({
    queryKey: ["deals", "board"],
    queryFn: ({ signal }) => getDeals(1, 200, {}, signal),
  });

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <Link to="/acquisitions" className="text-sm font-medium text-brand hover:underline">
        ← Pipeline board
      </Link>
      <ul className="mt-3 max-h-[calc(100vh-14rem)] space-y-0.5 overflow-y-auto pr-1">
        {(data?.items ?? []).map((deal) => {
          const meta = stageMeta(deal.stage);
          const active = deal.id === activeDealId;
          return (
            <li key={deal.id}>
              <Link
                to={`/acquisitions/${deal.id}`}
                className={[
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  active ? "bg-brand/10 font-semibold text-brand" : "text-slate-600 hover:bg-slate-100",
                ].join(" ")}
              >
                <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                <span className="truncate">{deal.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
