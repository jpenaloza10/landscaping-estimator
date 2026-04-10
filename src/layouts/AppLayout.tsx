import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Projects",  to: "/projects"  },
  { label: "Estimates", to: "/estimates" },
  { label: "Estimator", to: "/estimate"  },
  { label: "Expenses",  to: "/expenses"  },
] as const;

export default function AppLayout() {
  const [dropOpen,    setDropOpen]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [signingOut,  setSigningOut]  = useState(false);
  const dropRef  = useRef<HTMLDivElement>(null);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, signOut } = useAuth();

  const displayName   = user?.name ?? user?.email ?? "Account";
  const initials      = displayName.slice(0, 2).toUpperCase();

  // Active page label for the dropdown button
  const activeItem = NAV_ITEMS.find((n) => location.pathname.startsWith(n.to));

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      await signOut();
      navigate("/", { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-brand-green text-brand-cream antialiased"
      style={{ backgroundColor: "#1B3A1E", color: "#F4EFE4" }}
    >
      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 bg-brand-cream border-b border-brand-green/10">
        <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 sm:px-8">

          {/* Left — pages dropdown */}
          <div ref={dropRef} className="hidden md:block relative">
            <button
              onClick={() => setDropOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={dropOpen}
              className="flex items-center gap-2 font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-green hover:text-brand-orange transition-colors"
            >
              {/* Hamburger lines become an X when open */}
              <span className="relative w-4 h-3.5 flex flex-col justify-between">
                <span className={`block h-px bg-current transition-all origin-center ${dropOpen ? "rotate-45 translate-y-[6px]" : ""}`} />
                <span className={`block h-px bg-current transition-all ${dropOpen ? "opacity-0" : ""}`} />
                <span className={`block h-px bg-current transition-all origin-center ${dropOpen ? "-rotate-45 -translate-y-[8px]" : ""}`} />
              </span>
              Menu
              {activeItem && !dropOpen && (
                <span className="text-brand-orange">— {activeItem.label}</span>
              )}
            </button>

            {/* Dropdown panel */}
            {dropOpen && (
              <div className="absolute top-full left-0 mt-3 w-52 bg-brand-cream border border-brand-green/12 shadow-xl rounded-sm overflow-hidden">
                {/* Section label */}
                <div className="px-4 py-2.5 border-b border-brand-green/10">
                  <p className="font-sans text-[9px] font-semibold tracking-[0.26em] uppercase text-brand-orange">
                    Pages
                  </p>
                </div>

                {NAV_ITEMS.map(({ label, to }) => {
                  const isActive = location.pathname.startsWith(to);
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setDropOpen(false)}
                      className={`flex items-center justify-between px-4 py-3.5 transition-colors group ${
                        isActive
                          ? "bg-brand-green/6"
                          : "hover:bg-brand-green/4"
                      }`}
                    >
                      <span className={`font-sans text-[11px] font-semibold tracking-[0.16em] uppercase transition-colors ${
                        isActive ? "text-brand-orange" : "text-brand-green group-hover:text-brand-orange"
                      }`}>
                        {label}
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* Centre wordmark */}
          <Link
            to="/dashboard"
            className="font-serif text-lg font-bold italic text-brand-green tracking-wide absolute left-1/2 -translate-x-1/2"
          >
            Landscaping Estimator
          </Link>

          {/* Right — user + sign out */}
          <div className="hidden md:flex items-center gap-5">
            {/* Avatar initials */}
            <div
              className="w-7 h-7 rounded-full bg-brand-green flex items-center justify-center"
              title={displayName}
            >
              <span className="font-sans text-[10px] font-bold text-brand-cream">
                {initials}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-green hover:text-brand-orange transition-colors disabled:opacity-50"
            >
              {signingOut ? "Signing out…" : "Sign Out"}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden ml-auto text-brand-green p-2"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Mobile full-screen drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-brand-green/10 bg-brand-cream">
            <nav className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
              {NAV_ITEMS.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `font-sans text-[11px] font-semibold tracking-[0.18em] uppercase py-2.5 border-b border-brand-green/8 last:border-0 transition-colors ${
                      isActive ? "text-brand-orange" : "text-brand-green hover:text-brand-orange"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
              <div className="pt-4 mt-2 border-t border-brand-green/10 flex items-center justify-between">
                <p className="font-sans text-[10px] tracking-widest uppercase text-brand-green/50 truncate max-w-[180px]">
                  {displayName}
                </p>
                <button
                  onClick={() => { setMobileOpen(false); void handleSignOut(); }}
                  disabled={signingOut}
                  className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-green hover:text-brand-orange transition-colors disabled:opacity-50"
                >
                  {signingOut ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── CONTENT ── */}
      <main
        className="mx-auto max-w-7xl px-4 sm:px-8 py-8"
        style={{ minHeight: "calc(100vh - 124px)" }}
      >
        <Outlet />
      </main>

      {/* ── FOOTER ── */}
      <footer
        className="border-t border-brand-cream/10 py-6 px-8 flex flex-wrap items-center justify-between gap-4"
        style={{ backgroundColor: "#111E12" }}
      >
        <span className="font-serif text-base italic font-bold text-brand-cream">
          Landscaping Estimator
        </span>
        <span
          className="font-sans text-[11px] tracking-widest uppercase opacity-50"
          style={{ color: "#D9D1C0" }}
        >
          © {new Date().getFullYear()} · All rights reserved
        </span>
      </footer>
    </div>
  );
}
