// src/layouts/AppLayout.tsx
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Friendly display name for header
  const displayName =
    (user?.user_metadata as Record<string, any>)?.name ??
    (user?.user_metadata as Record<string, any>)?.full_name ??
    user?.email ??
    "Account";

  async function handleSignOut() {
    try {
      setSigningOut(true);
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md p-2 hover:bg-slate-100 lg:hidden"
              aria-label="Toggle menu"
              onClick={() => setOpen(v => !v)}
            >
              ☰
            </button>
            <span className="font-semibold">Landscaping Estimator</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-4 text-sm lg:flex">
            <NavLink className={({isActive}) => isActive ? "font-medium underline" : "hover:underline"} to="/dashboard">Dashboard</NavLink>
            <NavLink className={({isActive}) => isActive ? "font-medium underline" : "hover:underline"} to="/projects">Projects</NavLink>
            <NavLink className={({isActive}) => isActive ? "font-medium underline" : "hover:underline"} to="/expenses">Expenses</NavLink>
            <NavLink className={({isActive}) => isActive ? "font-medium underline" : "hover:underline"} to="/account">Account</NavLink>
            <NavLink className={({isActive}) => isActive ? "font-medium underline" : "hover:underline"} to="/assemblies">Assemblies</NavLink>
            <NavLink className={({isActive}) => isActive ? "font-medium underline" : "hover:underline"} to="/estimate">Estimator</NavLink>

            {/* Divider */}
            <span className="mx-2 h-5 w-px bg-slate-200" />

            {/* Account + Sign Out */}
            <span className="max-w-[200px] truncate text-slate-600" title={displayName}>
              {displayName}
            </span>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-lg border px-3 py-2 text-red-600 hover:bg-gray-100 disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign Out"}
            </button>
          </nav>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="border-t bg-white lg:hidden">
            <div className="mx-auto max-w-7xl px-4 py-3">
              <div className="flex flex-col gap-3">
                <NavLink to="/dashboard" onClick={() => setOpen(false)}>Dashboard</NavLink>
                <NavLink to="/projects" onClick={() => setOpen(false)}>Projects</NavLink>
                <NavLink to="/expenses" onClick={() => setOpen(false)}>Expenses</NavLink>
                <NavLink to="/account" onClick={() => setOpen(false)}>Account</NavLink>
                <NavLink to="/assemblies" onClick={() => setOpen(false)}>Assemblies</NavLink>
                <NavLink to="/estimate" onClick={() => setOpen(false)}>Estimator</NavLink>

                <div className="mt-2 border-t pt-2 text-sm text-slate-600">{displayName}</div>
                <button
                  onClick={async () => {
                    setOpen(false);
                    await handleSignOut();
                  }}
                  disabled={signingOut}
                  className="rounded-lg border px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 disabled:opacity-60"
                >
                  {signingOut ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Page container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Default responsive grid wrapper that your pages can rely on */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Outlet />
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Landscaping Estimator
      </footer>
    </div>
  );
}
