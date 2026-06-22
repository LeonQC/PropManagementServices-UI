import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Listings", to: "/listings" },
  { label: "Acquisitions", to: "/acquisitions" },
  { label: "Map", to: "/map" },
  { label: "Reports", to: "/reports" },
  { label: "Admin", to: "/admin" },
];

export default function TopNav() {
  return (
    <header className="bg-header text-white">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-8 px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-sm font-bold text-white">
            P
          </span>
          <span className="text-lg font-semibold tracking-tight">PropTrack</span>
        </div>

        {/* Primary nav */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right-side actions (visual only for the MVP) */}
        <div className="ml-auto flex items-center gap-4 text-white/80">
          <button
            type="button"
            aria-label="Search"
            title="Coming soon"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            title="Coming soon"
            className="relative grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"
          >
            <BellIcon />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-header" />
          </button>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-xs font-semibold text-white">
            SC
          </span>
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
