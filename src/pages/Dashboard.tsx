// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getProjects, type Project } from "../lib/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Prefer user.name from metadata, then full_name, then email, then a friendly fallback
  const displayName =
    (user?.user_metadata as Record<string, any>)?.name ??
    (user?.user_metadata as Record<string, any>)?.full_name ??
    user?.email ??
    "there";

  useEffect(() => {
    (async () => {
      try {
        const list = await getProjects(); // api() attaches token
        setProjects(list || []);
      } catch (e: any) {
        setErr(e?.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- CARDS (rendered directly into AppLayout's responsive grid) ---

  // 1) Welcome / banner (full width)
  const WelcomeCard = (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-green-700">Welcome, {displayName}</h1>
          <p className="text-sm text-gray-600">
            Your snapshot of projects and budgets at a glance.
          </p>
        </div>
        <div className="mt-3 sm:mt-0">
          <Link
            to="/projectwizard"
            className="inline-flex items-center rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            + New Project
          </Link>
        </div>
      </div>
    </div>
  );

  // 2) Quick actions
  const QuickActionsCard = (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold">Quick Actions</h2>
      <div className="flex flex-col gap-2">
        <Link
          to="/projectwizard"
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Create Project
        </Link>
        <Link
          to="/projects"
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          View All Projects
        </Link>
        <Link
          to="/expenses"
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Open Expense Tracker
        </Link>
      </div>
    </div>
  );

  // 3) Recent projects (span 2 cols on large screens)
  const RecentProjectsCard = (
    <div className="rounded-2xl bg-white p-4 shadow-sm lg:col-span-2">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Recent Projects</h2>
        <Link to="/projects" className="text-sm text-green-700 hover:underline">
          View all
        </Link>
      </div>

      {loading && <div className="text-sm text-gray-600">Loading projects…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      {!loading && !err && projects.length === 0 && (
        <div className="text-sm text-gray-500">
          No projects yet — create your first one.
        </div>
      )}

      {!loading && !err && projects.length > 0 && (
        <ul className="divide-y">
          {projects.slice(0, 6).map((p) => (
            <li key={p.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="truncate text-xs text-gray-600">
                    {p.location || "No location"}
                  </div>
                  {p.description && (
                    <div className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-gray-500">
                      {p.description}
                    </div>
                  )}
                  <div className="mt-1 text-[11px] text-gray-400">
                    Created: {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
                <Link
                  to={`/projects/${p.id}`}
                  className="shrink-0 rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                >
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // 4) Budget snapshot placeholder (wire up later)
  const BudgetSnapshotCard = (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold">Budget Snapshot</h2>
      <p className="text-sm text-gray-600">
        Track estimated vs. actual. Connect expenses to see live burn.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-gray-500">Estimated</div>
          <div className="text-sm font-semibold">$0</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-gray-500">Actual</div>
          <div className="text-sm font-semibold">$0</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-gray-500">Remaining</div>
          <div className="text-sm font-semibold">$0</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {WelcomeCard}
      {QuickActionsCard}
      {RecentProjectsCard}
      {BudgetSnapshotCard}
    </>
  );
}
