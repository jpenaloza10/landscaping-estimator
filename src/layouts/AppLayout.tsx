import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AppLayout() {
  const [open, setOpen] = useState(false);

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
          <nav className="hidden gap-6 text-sm lg:flex">
            <NavLink className={({isActive}) => isActive ? "font-medium underline" : "hover:underline"} to="/dashboard">Dashboard</NavLink>
            <NavLink className={({isActive}) => isActive ? "font-medium underline" : "hover:underline"} to="/projects">Projects</NavLink>
            <NavLink className={({isActive}) => isActive ? "font-medium underline" : "hover:underline"} to="/expenses">Expenses</NavLink>
            <NavLink className={({isActive}) => isActive ? "font-medium underline" : "hover:underline"} to="/account">Account</NavLink>
          </nav>
        </div>

        {open && (
          <div className="border-t bg-white lg:hidden">
            <div className="mx-auto max-w-7xl px-4 py-3">
              <div className="flex flex-col gap-3">
                <NavLink to="/dashboard" onClick={() => setOpen(false)}>Dashboard</NavLink>
                <NavLink to="/projects" onClick={() => setOpen(false)}>Projects</NavLink>
                <NavLink to="/expenses" onClick={() => setOpen(false)}>Expenses</NavLink>
                <NavLink to="/account" onClick={() => setOpen(false)}>Account</NavLink>
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
