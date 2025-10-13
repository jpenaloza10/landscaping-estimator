import { BrowserRouter, Routes, Route, Link, NavLink, Navigate, useNavigate } from "react-router-dom";
import { useState, type ReactNode } from "react";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Projects from "./pages/Projects";
import ProjectWizard from "./pages/ProjectWizard";
import { useAuth } from "./auth/AuthContext";

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Landing: if logged in -> /projects, else show Login */}
          <Route path="/" element={<LandingOrRedirect />} />

          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected routes */}
          <Route
            path="/projects"
            element={
              <RequireAuth>
                <Projects />
              </RequireAuth>
            }
          />
          <Route
            path="/projects/new"
            element={
              <RequireAuth>
                <ProjectWizard />
              </RequireAuth>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu after navigation
  function handleNavClick(cb?: () => void) {
    return () => {
      setMenuOpen(false);
      cb?.();
    };
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {/* Skip link for a11y */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] rounded bg-slate-900 px-3 py-2 text-white"
      >
        Skip to content
      </a>

      {/* HEADER / NAV */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-bold text-green-700" onClick={handleNavClick()}>
              Landscaping Estimator
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm" aria-label="Primary">
            {!user ? (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    isActive ? "text-green-800 font-medium" : "text-green-700 hover:text-green-800"
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className={({ isActive }) =>
                    isActive ? "text-green-800 font-medium" : "text-green-700 hover:text-green-800"
                  }
                >
                  Sign Up
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/projects"
                  className={({ isActive }) =>
                    isActive ? "text-green-800 font-medium" : "text-green-700 hover:text-green-800"
                  }
                >
                  Projects
                </NavLink>
                <button
                  onClick={handleNavClick(async () => {
                    await clearAuth();
                    navigate("/login", { replace: true });
                  })}
                  className="text-red-600 hover:text-red-700"
                  title="Logout"
                >
                  Logout
                </button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-slate-100"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200">
            <nav
              className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-2 text-sm"
              aria-label="Mobile"
            >
              {!user ? (
                <>
                  <NavLink
                    to="/login"
                    onClick={handleNavClick()}
                    className={({ isActive }) => (isActive ? "text-green-800 font-medium" : "text-green-700")}
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/signup"
                    onClick={handleNavClick()}
                    className={({ isActive }) => (isActive ? "text-green-800 font-medium" : "text-green-700")}
                  >
                    Sign Up
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to="/projects"
                    onClick={handleNavClick()}
                    className={({ isActive }) => (isActive ? "text-green-800 font-medium" : "text-green-700")}
                  >
                    Projects
                  </NavLink>
                  <button
                    onClick={handleNavClick(async () => {
                      await clearAuth();
                      navigate("/login", { replace: true });
                    })}
                    className="text-red-600 text-left"
                    title="Logout"
                  >
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <main id="main" className="grid gap-6 md:grid-cols-3">
          <section className="md:col-span-2 bg-white rounded-2xl shadow p-4">{children}</section>
          <aside className="bg-white rounded-2xl shadow p-4 hidden md:block">
            <h2 className="font-semibold mb-2">Project Summary</h2>
            <p className="text-sm text-slate-600">Quick stats, recent uploads, etc.</p>
          </aside>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Landscaping Estimator
      </footer>
    </div>
  );
}

function LandingOrRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null; // or a spinner/skeleton
  return user ? <Navigate to="/projects" replace /> : <Login />;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return null; // show nothing (or a skeleton) while auth initializes
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
