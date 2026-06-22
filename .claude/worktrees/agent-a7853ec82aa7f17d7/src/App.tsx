import {
  BrowserRouter, Routes, Route, Link, NavLink,
  Navigate, useNavigate, Outlet,
} from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "./auth/AuthContext";

// Pages
import Home          from "./pages/Home";
import Login         from "./pages/Login";
import SignUp        from "./pages/SignUp";
import Projects      from "./pages/Projects";
import ProjectWizard from "./pages/ProjectWizard";
import ProjectDetail from "./pages/ProjectDetail";
import Dashboard     from "./pages/Dashboard";
import Expenses      from "./pages/Expenses";

// Demo pages
import SampleProjects  from "./pages/demo/SampleProjects";
import SampleEstimates from "./pages/demo/SampleEstimates";
import SampleExpenses  from "./pages/demo/SampleExpenses";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing — full-width, own shell */}
        <Route path="/" element={<LandingOrDashboard />} />

        {/* Demo preview pages — own shell with banner */}
        <Route path="/demo/projects"  element={<SampleProjects />} />
        <Route path="/demo/estimates" element={<SampleEstimates />} />
        <Route path="/demo/expenses"  element={<SampleExpenses />} />

        {/* App pages — AppShell layout via Outlet */}
        <Route element={<AppShell />}>
          <Route path="/login"         element={<Login />} />
          <Route path="/signup"        element={<SignUp />} />
          <Route path="/projects"      element={<RequireAuth><Projects /></RequireAuth>} />
          <Route path="/projects/new"  element={<RequireAuth><ProjectWizard /></RequireAuth>} />
          <Route path="/projects/:id"  element={<RequireAuth><ProjectDetail /></RequireAuth>} />
          <Route path="/dashboard"     element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/expenses"      element={<RequireAuth><Expenses /></RequireAuth>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/* ─────────────────────────────────────────────
   APP SHELL  (nav + footer for authenticated pages)
───────────────────────────────────────────── */
function AppShell() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNavClick(cb?: () => void) {
    return () => { setMenuOpen(false); cb?.(); };
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-sans text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors ${
      isActive ? "text-brand-orange" : "text-brand-green hover:text-brand-orange"
    }`;

  return (
    <div className="min-h-screen bg-brand-green text-brand-cream antialiased" style={{ backgroundColor: "#1B3A1E", color: "#F4EFE4" }}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] bg-brand-cream text-brand-green px-3 py-2 text-xs font-bold tracking-widest uppercase">
        Skip to content
      </a>

      {/* NAV */}
      <header className="sticky top-0 z-50 bg-brand-cream border-b border-brand-green/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 h-[60px] flex items-center justify-between">

          <nav className="hidden md:flex items-center gap-8" aria-label="Primary left">
            {user ? (
              <>
                <NavLink to="/projects"  className={navLinkClass}>Projects</NavLink>
                <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
              </>
            ) : (
              <NavLink to="/login" className={navLinkClass}>Sign In</NavLink>
            )}
          </nav>

          <Link to="/" className="font-serif text-lg font-bold italic text-brand-green tracking-wide absolute left-1/2 -translate-x-1/2">
            Landscaping Estimator
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Primary right">
            {user ? (
              <>
                <NavLink to="/expenses" className={navLinkClass}>Expenses</NavLink>
                <button
                  onClick={handleNavClick(async () => {
                    await clearAuth();
                    navigate("/", { replace: true });
                  })}
                  className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-green hover:text-brand-orange transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <NavLink to="/signup" className={navLinkClass}>Sign Up</NavLink>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden ml-auto text-brand-green p-2"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-brand-green/10 bg-brand-cream">
            <nav className="px-4 py-4 flex flex-col gap-4" aria-label="Mobile">
              {!user ? (
                <>
                  <NavLink to="/login"  onClick={handleNavClick()} className={navLinkClass}>Sign In</NavLink>
                  <NavLink to="/signup" onClick={handleNavClick()} className={navLinkClass}>Sign Up</NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/projects"  onClick={handleNavClick()} className={navLinkClass}>Projects</NavLink>
                  <NavLink to="/dashboard" onClick={handleNavClick()} className={navLinkClass}>Dashboard</NavLink>
                  <NavLink to="/expenses"  onClick={handleNavClick()} className={navLinkClass}>Expenses</NavLink>
                  <button
                    onClick={handleNavClick(async () => {
                      await clearAuth();
                      navigate("/", { replace: true });
                    })}
                    className="text-left font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-green hover:text-brand-orange"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* CONTENT */}
      <main id="main" className="mx-auto max-w-7xl px-4 sm:px-8 py-8" style={{ minHeight: "calc(100vh - 60px)" }}>
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-brand-green-dark border-t border-brand-cream/10 py-8 px-8 flex flex-wrap items-center justify-between gap-4">
        <span className="font-serif text-base italic font-bold text-brand-cream">Landscaping Estimator</span>
        <span className="font-sans text-[11px] tracking-widest uppercase text-brand-cream-dim opacity-50">
          © {new Date().getFullYear()} · All rights reserved
        </span>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GUARDS
───────────────────────────────────────────── */
function LandingOrDashboard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/projects" replace /> : <Home />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
