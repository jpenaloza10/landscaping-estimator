import { Link } from "react-router-dom";
import DemoShell from "./DemoShell";

const PROJECTS = [
  {
    id: 1,
    name: "Riverside Backyard Overhaul",
    client: "Michael & Sandra Torres",
    location: "San Jose, CA",
    status: "Active",
    estimates: 2,
    budget: 8400,
    spent: 5230,
    created: "Mar 1, 2026",
  },
  {
    id: 2,
    name: "Oak Street Front Garden",
    client: "City of Sunnyvale",
    location: "Sunnyvale, CA",
    status: "Completed",
    estimates: 1,
    budget: 3250,
    spent: 3110,
    created: "Jan 14, 2026",
  },
  {
    id: 3,
    name: "Sunnyvale HOA Commons",
    client: "Ridgecrest HOA",
    location: "Sunnyvale, CA",
    status: "Estimating",
    estimates: 3,
    budget: 14800,
    spent: 0,
    created: "Mar 18, 2026",
  },
  {
    id: 4,
    name: "Palo Alto Drought-Tolerant Redesign",
    client: "Dr. Helen Chiu",
    location: "Palo Alto, CA",
    status: "Active",
    estimates: 1,
    budget: 6200,
    spent: 1800,
    created: "Feb 28, 2026",
  },
  {
    id: 5,
    name: "Campbell Irrigation Upgrade",
    client: "Evergreen Estates LLC",
    location: "Campbell, CA",
    status: "Completed",
    estimates: 2,
    budget: 4100,
    spent: 3975,
    created: "Dec 3, 2025",
  },
];

const STATUS_COLORS: Record<string, string> = {
  Active:     "text-brand-orange",
  Completed:  "text-brand-cream-dim",
  Estimating: "text-brand-orange-light",
};

export default function SampleProjects() {
  const totalBudget = PROJECTS.reduce((s, p) => s + p.budget, 0);
  const totalSpent  = PROJECTS.reduce((s, p) => s + p.spent,  0);
  const active      = PROJECTS.filter((p) => p.status === "Active").length;

  return (
    <DemoShell activeTab="projects">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="brand-eyebrow mb-1">Your Work</p>
          <h1 className="font-serif text-4xl font-black italic text-brand-cream">Projects</h1>
        </div>
        <button
          onClick={() => alert("Sign up to create real projects!")}
          className="btn-brand-orange"
        >
          + New Project
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Projects"   value={String(PROJECTS.length)} />
        <StatCard label="Active"           value={String(active)} accent />
        <StatCard label="Combined Budget"  value={`$${totalBudget.toLocaleString()}`} />
      </div>

      {/* Project cards */}
      <div className="space-y-4">
        {PROJECTS.map((p) => {
          const pct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
          return (
            <div key={p.id} className="brand-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h2 className="font-serif text-xl font-bold italic text-brand-cream">{p.name}</h2>
                    <span className={`font-sans text-[10px] font-semibold tracking-widest uppercase ${STATUS_COLORS[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="font-sans text-sm text-brand-cream-dim/70">{p.client} · {p.location}</p>
                  <p className="font-sans text-xs text-brand-cream-dim/40 mt-0.5">Created {p.created} · {p.estimates} estimate{p.estimates !== 1 ? "s" : ""}</p>
                </div>

                {/* Budget */}
                <div className="text-right shrink-0">
                  <p className="font-serif text-2xl font-black text-brand-cream">${p.budget.toLocaleString()}</p>
                  <p className="font-sans text-xs text-brand-cream-dim/50 mt-0.5">
                    ${p.spent.toLocaleString()} spent
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              {p.spent > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="font-sans text-[10px] tracking-wider uppercase text-brand-cream-dim/50">Budget used</span>
                    <span className="font-sans text-[10px] font-semibold text-brand-cream-dim">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-brand-cream/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct > 90 ? "bg-brand-orange" : "bg-brand-orange-light"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-brand-cream/10 flex gap-4">
                <button
                  onClick={() => alert("Sign up to view project details!")}
                  className="font-sans text-[10px] font-semibold tracking-[0.16em] uppercase text-brand-cream border border-brand-cream/25 px-4 py-2 hover:border-brand-cream/60 transition-colors"
                >
                  Open →
                </button>
                <button
                  onClick={() => alert("Sign up to view estimates!")}
                  className="font-sans text-[10px] font-semibold tracking-[0.16em] uppercase text-brand-cream-dim hover:text-brand-cream transition-colors"
                >
                  {p.estimates} Estimate{p.estimates !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sign-up CTA */}
      <div className="mt-12 brand-card text-center py-10">
        <p className="brand-eyebrow mb-3">Ready to track your own projects?</p>
        <h2 className="font-serif text-2xl font-bold italic text-brand-cream mb-6">Create a free account</h2>
        <Link to="/signup" className="btn-brand-primary">
          Get Started →
        </Link>
      </div>
    </DemoShell>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="brand-card text-center py-6">
      <p className="brand-eyebrow mb-2">{label}</p>
      <p className={`font-serif text-3xl font-black ${accent ? "text-brand-orange" : "text-brand-cream"}`}>{value}</p>
    </div>
  );
}
