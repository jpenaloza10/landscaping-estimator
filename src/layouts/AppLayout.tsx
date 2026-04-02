import { useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const displayName = user?.name ?? user?.email ?? "Account";

  async function handleSignOut() {
    try {
      setSigningOut(true);
      await signOut();
      navigate("/", { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-sans text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors ${
      isActive ? "text-brand-orange" : "text-brand-green hover:text-brand-orange"
    }`;

  return (
    <div
      className="min-h-screen bg-brand-green text-brand-cream antialiased"
      style={{ backgroundColor: "#1B3A1E", color: "#F4EFE4" }}
    >
      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 bg-brand-cream border-b border-brand-green/10">
        <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 sm:px-8">

          {/* Left nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Primary left">
            <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
            <NavLink to="/projects"  className={navLinkClass}>Projects</NavLink>
            <NavLink to="/estimate"  className={navLinkClass}>Estimator</NavLink>
          </nav>

          {/* Centre wordmark */}
          <Link
            to="/dashboard"
            className="font-serif text-lg font-bold italic text-brand-green tracking-wide absolute left-1/2 -translate-x-1/2"
          >
            Landscaping Estimator
          </Link>

          {/* Right nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Primary right">
            <NavLink to="/expenses" className={navLinkClass}>Expenses</NavLink>

            <div className="flex items-center gap-4 border-l border-brand-green/15 pl-6">
              <span
                className="font-sans text-[10px] tracking-widest uppercase text-brand-green/60 max-w-[140px] truncate"
                title={displayName}
              >
                {displayName}
              </span>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-green hover:text-brand-orange transition-colors disabled:opacity-50"
              >
                {signingOut ? "Signing out…" : "Sign Out"}
              </button>
            </div>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden ml-auto text-brand-green p-2"
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

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-brand-green/10 bg-brand-cream">
            <nav className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-4">
              <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={navLinkClass}>Dashboard</NavLink>
              <NavLink to="/projects"  onClick={() => setMobileOpen(false)} className={navLinkClass}>Projects</NavLink>
              <NavLink to="/estimate"  onClick={() => setMobileOpen(false)} className={navLinkClass}>Estimator</NavLink>
              <NavLink to="/expenses"  onClick={() => setMobileOpen(false)} className={navLinkClass}>Expenses</NavLink>
              <div className="border-t border-brand-green/10 pt-3 mt-1 space-y-3">
                <p className="font-sans text-[10px] tracking-widest uppercase text-brand-green/50 truncate">
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
