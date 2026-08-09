import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useDebounce } from "../../lib/useDebounce";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Listings", to: "/listings" },
  { label: "Acquisitions", to: "/acquisitions" },
  { label: "Map", to: "/map" },
  { label: "Reports", to: "/reports" },
  // Admin is role-gated below.
  { label: "Admin", to: "/admin", roles: ["Admin", "Managing Director"] },
];

function initials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // The one global search box. /search keeps its query in ?q=, and this input is that
  // param's editor while you're there — which is why there is no second box on the page.
  const location = useLocation();
  const [params] = useSearchParams();
  const onSearchPage = location.pathname === "/search";
  const urlQuery = onSearchPage ? (params.get("q") ?? "") : "";
  const entityType = onSearchPage ? params.get("type") : null;

  const [query, setQuery] = useState(urlQuery);
  const debouncedQuery = useDebounce(query.trim(), 300);

  // Follow the URL: seeds the box from a shared link, and clears it on the way out of
  // /search. Typing never fights this — the effect below has already pushed the same
  // value into the URL by the time it changes.
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  // Live-update the results only once you're on /search. Typing here from the listings
  // grid must not yank you off the page mid-keystroke, so elsewhere it takes Enter.
  useEffect(() => {
    if (!onSearchPage || debouncedQuery === urlQuery) return;
    navigate(`/search?${searchParamsFor(debouncedQuery, entityType)}`, { replace: true });
  }, [debouncedQuery, onSearchPage, urlQuery, entityType, navigate]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = query.trim();
    if (!keyword) return;
    // A push, not a replace: Back should return to wherever the search started.
    navigate(`/search?${searchParamsFor(keyword, entityType)}`);
  };

  // Close the user menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const onLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

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
          {visibleItems.map((item) => (
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

        {/* Right-side actions */}
        <div className="ml-auto flex items-center gap-4 text-white/80">
          <form onSubmit={onSearchSubmit} role="search" className="relative">
            {/* A real submit button, not decoration: it makes Enter submit the form
                regardless of implicit-submission rules, and gives the box a click target. */}
            <button
              type="submit"
              aria-label="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            >
              <SearchIcon />
            </button>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search properties and deals"
              placeholder="Search everything..."
              className="w-56 rounded-full border border-white/10 bg-white/10 py-1.5 pl-9 pr-8 text-sm text-white placeholder:text-white/50 focus:border-white/30 focus:bg-white/15 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                <CloseIcon />
              </button>
            )}
          </form>
          <button
            type="button"
            aria-label="Notifications"
            title="Coming soon"
            className="relative grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"
          >
            <BellIcon />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-header" />
          </button>

          {/* User menu */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-xs font-semibold text-white ring-2 ring-transparent hover:ring-white/30"
                title={user.fullName ?? user.email}
              >
                {initials(user.fullName, user.email)}
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-800 shadow-lg"
                >
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold">
                      {user.fullName ?? user.email}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                    <span className="mt-1 inline-block rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-hover">
                      {user.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={onLogout}
                    className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/** Preserves the entity-type filter across keyword edits — narrowing to Deals and then
 *  retyping shouldn't silently widen back to everything. */
function searchParamsFor(q: string, entityType: string | null): URLSearchParams {
  const next = new URLSearchParams();
  if (q) next.set("q", q);
  if (entityType) next.set("type", entityType);
  return next;
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
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
