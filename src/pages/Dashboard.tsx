import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  getProjects,
  type Project,
  getDashboardSummary,
  type DashboardSummary,
} from "../lib/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsErr, setProjectsErr] = useState<string | null>(null);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryErr, setSummaryErr] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Prefer user.name, then email, then a friendly fallback
  const displayName = user?.name ?? user?.email ?? "there";

  useEffect(() => {
    (async () => {
      try {
        // Load projects + summary in parallel
        const [projectList, dashSummary] = await Promise.all([
          getProjects(),
          getDashboardSummary(),
        ]);
        setProjects(projectList || []);
        setSummary(dashSummary);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load dashboard data";
        setProjectsErr(msg);
        setSummaryErr(msg);
      } finally {
        setLoadingProjects(false);
        setLoadingSummary(false);
      }
    })();
  }, []);

  // Compute budget snapshot values (fall back to 0s if summary missing)
  const estimated = summary?.contractValue ?? 0;
  const actual = summary?.totalExpenses ?? 0;
  const remaining = estimated - actual;

  // --- CARDS (rendered directly into AppLayout's responsive grid) ---

  // 1) Welcome banner
  const WelcomeCard = (
    <div className="brand-card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <p className="brand-eyebrow mb-1">Dashboard</p>
        <h1 className="font-serif text-3xl font-black italic text-brand-cream">
          Welcome, {displayName}
        </h1>
        <p className="font-sans text-xs text-brand-cream-dim mt-1 tracking-wide">
          Your snapshot of projects and budgets at a glance.
        </p>
      </div>
      <Link to="/projects/new" className="btn-brand-primary shrink-0 mt-3 sm:mt-0">
        + New Project
      </Link>
    </div>
  );

  // 2) Quick actions
  const QuickActionsCard = (
    <div className="brand-card">
      <p className="brand-eyebrow mb-3">Quick Actions</p>
      <div className="flex flex-col gap-2">
        {[
          { to: "/projects/new", label: "Create Project" },
          { to: "/projects",     label: "View All Projects" },
          { to: "/expenses",     label: "Expense Tracker" },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="font-sans text-[11px] font-semibold tracking-[0.15em] uppercase
                       border border-brand-cream/20 px-3 py-2 text-brand-cream-dim
                       hover:border-brand-cream/50 hover:text-brand-cream transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );

  // 3) Recent projects
  const RecentProjectsCard = (
    <div className="brand-card">
      <div className="flex items-center justify-between mb-4">
        <p className="brand-eyebrow">Recent Projects</p>
        <Link to="/projects" className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream-dim hover:text-brand-orange transition-colors">
          View all →
        </Link>
      </div>

      {loadingProjects && (
        <p className="font-sans text-xs text-brand-cream-dim animate-pulse">Loading projects…</p>
      )}
      {projectsErr && (
        <p className="font-sans text-xs text-brand-orange">{projectsErr}</p>
      )}
      {!loadingProjects && !projectsErr && projects.length === 0 && (
        <p className="font-sans text-xs text-brand-cream-dim">No projects yet — create your first one.</p>
      )}
      {!loadingProjects && !projectsErr && projects.length > 0 && (
        <ul className="divide-y divide-brand-cream/10">
          {projects.slice(0, 6).map((p) => (
            <li key={p.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-serif text-sm font-bold italic text-brand-cream truncate">{p.name}</div>
                  <div className="font-sans text-[11px] text-brand-cream-dim truncate mt-0.5">
                    {p.location || "No location"}
                  </div>
                </div>
                <Link
                  to={`/projects/${p.id}`}
                  className="shrink-0 font-sans text-[10px] font-semibold tracking-widest uppercase
                             border border-brand-cream/20 px-2 py-1 text-brand-cream-dim
                             hover:border-brand-orange hover:text-brand-orange transition-colors"
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

  // 4) Budget snapshot
  const BudgetSnapshotCard = (
    <div className="brand-card">
      <p className="brand-eyebrow mb-4">Budget Snapshot</p>

      {loadingSummary && (
        <p className="font-sans text-xs text-brand-cream-dim animate-pulse">Loading…</p>
      )}
      {!loadingSummary && summaryErr && (
        <p className="font-sans text-xs text-brand-orange">{summaryErr}</p>
      )}
      {!loadingSummary && !summaryErr && summary == null && (
        <p className="font-sans text-xs text-brand-cream-dim">No financial data yet.</p>
      )}
      {!loadingSummary && !summaryErr && summary && (
        <>
          <div className="grid grid-cols-3 gap-3 text-center mb-3">
            {[
              { label: "Contract",  value: estimated },
              { label: "Expenses",  value: actual },
              { label: "Remaining", value: remaining, colored: true },
            ].map(({ label, value, colored }) => (
              <div key={label} className="border border-brand-cream/15 p-3">
                <div className="font-sans text-[10px] tracking-widest uppercase text-brand-cream-dim mb-1">{label}</div>
                <div className={`font-serif text-base font-bold italic ${colored && value < 0 ? "text-brand-orange" : "text-brand-cream"}`}>
                  ${value.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
          <div className="border border-brand-cream/15 p-3 text-center">
            <div className="font-sans text-[10px] tracking-widest uppercase text-brand-cream-dim mb-1">Gross Profit</div>
            <div className={`font-serif text-xl font-black italic ${summary.grossProfit < 0 ? "text-brand-orange" : "text-brand-orange-light"}`}>
              ${summary.grossProfit.toFixed(0)}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {WelcomeCard}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {RecentProjectsCard}
        </div>
        <div className="space-y-6">
          {QuickActionsCard}
          {BudgetSnapshotCard}
        </div>
      </div>
    </div>
  );
}
