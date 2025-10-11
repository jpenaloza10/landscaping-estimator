import { BrowserRouter, Routes, Route, Link, NavLink, Navigate, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
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
          <Route path="/" element={<LandingOrRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-green-700">Landscaping Estimator</Link>
          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <NavLink to="/login" className={({isActive}) => isActive ? "text-green-800 font-medium" : "text-green-700"}>Login</NavLink>
                <NavLink to="/signup" className={({isActive}) => isActive ? "text-green-800 font-medium" : "text-green-700"}>Sign Up</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/projects" className={({isActive}) => isActive ? "text-green-800 font-medium" : "text-green-700"}>Projects</NavLink>
                <button
                  onClick={() => { clearAuth(); navigate("/login", { replace: true }); }}
                  className="text-red-600"
                  title="Logout"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <main className="grid gap-6 md:grid-cols-3">
          <section className="md:col-span-2 bg-white rounded-2xl shadow p-4">
            {children}
          </section>
          <aside className="bg-white rounded-2xl shadow p-4 hidden md:block">
            <h2 className="font-semibold mb-2">Project Summary</h2>
            <p className="text-sm text-slate-600">Quick stats, recent uploads, etc.</p>
          </aside>
        </main>
      </div>
    </div>
  );
}

function LandingOrRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null; // or a small spinner
  return user ? <Navigate to="/projects" replace /> : <Login />;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return null; // or a skeleton while auth initializes
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
