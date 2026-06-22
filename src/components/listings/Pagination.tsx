interface Props {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

// Wired to the API: changing the page drives the React Query refetch.
export default function Pagination({ page, pageCount, onPageChange }: Props) {
  if (pageCount <= 1) return null;

  const pages = pageWindow(page, pageCount);

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Prev
      </PageButton>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-slate-400">
            …
          </span>
        ) : (
          <PageButton key={p} active={p === page} onClick={() => onPageChange(p)}>
            {p}
          </PageButton>
        )
      )}

      <PageButton disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        Next
      </PageButton>
    </nav>
  );
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "min-w-9 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        disabled ? "cursor-not-allowed opacity-40 hover:bg-white" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// Compact page list: 1 … 4 5 [6] 7 8 … 20
function pageWindow(page: number, pageCount: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const push = (n: number) => out.push(n);

  const left = Math.max(2, page - 1);
  const right = Math.min(pageCount - 1, page + 1);

  push(1);
  if (left > 2) out.push("…");
  for (let p = left; p <= right; p++) push(p);
  if (right < pageCount - 1) out.push("…");
  if (pageCount > 1) push(pageCount);

  return out;
}
