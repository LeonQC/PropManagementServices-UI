import { useEffect, useRef, useState } from "react";

interface Props {
  label: React.ReactNode;
  active?: boolean;
  align?: "left" | "right";
  panelClassName?: string;
  /** Receives a `close` callback so option handlers can dismiss the panel. */
  children: (close: () => void) => React.ReactNode;
}

// Lightweight popover: a trigger button plus a panel that closes on outside
// click or Escape. Used for the metro and price-range filters.
export default function Dropdown({
  label,
  active,
  align = "left",
  panelClassName = "",
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
          active
            ? "border-brand bg-brand/10 text-brand"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
        ].join(" ")}
      >
        {label}
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          className={[
            "absolute z-20 mt-2 rounded-lg border border-slate-200 bg-white p-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          ].join(" ")}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
