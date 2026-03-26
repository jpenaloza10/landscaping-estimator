import { useState } from "react";
import { Link } from "react-router-dom";
import DemoShell from "./DemoShell";

const PROJECTS = ["All Projects", "Riverside Backyard Overhaul", "Palo Alto Drought-Tolerant Redesign", "Sunnyvale HOA Commons"];

const EXPENSES = [
  { id: 1, project: "Riverside Backyard Overhaul",         vendor: "SodSource Inc.",            category: "Materials",    amount: 1320.00, date: "Mar 18, 2026", receipt: true  },
  { id: 2, project: "Riverside Backyard Overhaul",         vendor: "Manuel's Grading Co.",      category: "Subcontractor",amount: 480.00,  date: "Mar 20, 2026", receipt: false },
  { id: 3, project: "Riverside Backyard Overhaul",         vendor: "Lowe's – Milpitas",         category: "Materials",    amount: 218.45,  date: "Mar 21, 2026", receipt: true  },
  { id: 4, project: "Riverside Backyard Overhaul",         vendor: "Home Depot",                category: "Equipment",    amount: 84.99,   date: "Mar 22, 2026", receipt: true  },
  { id: 5, project: "Palo Alto Drought-Tolerant Redesign", vendor: "Peninsula Landscape Supply", category: "Materials",    amount: 680.00,  date: "Mar 2, 2026",  receipt: true  },
  { id: 6, project: "Palo Alto Drought-Tolerant Redesign", vendor: "Bay Area Steel Edging",     category: "Materials",    amount: 112.00,  date: "Mar 5, 2026",  receipt: true  },
  { id: 7, project: "Palo Alto Drought-Tolerant Redesign", vendor: "Fast Flatbed Delivery",     category: "Delivery",     amount: 95.00,   date: "Mar 6, 2026",  receipt: false },
  { id: 8, project: "Sunnyvale HOA Commons",               vendor: "Pacific Coast Irrigation",  category: "Subcontractor",amount: 1200.00, date: "Mar 19, 2026", receipt: true  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Materials:     "bg-brand-green/30 text-brand-cream-dim",
  Subcontractor: "bg-brand-orange/20 text-brand-orange-light",
  Equipment:     "bg-brand-cream/10 text-brand-cream-dim",
  Delivery:      "bg-brand-cream/5 text-brand-cream-dim",
};

const BUDGET_MAP: Record<string, { budget: number }> = {
  "Riverside Backyard Overhaul":          { budget: 8400  },
  "Palo Alto Drought-Tolerant Redesign":  { budget: 6200  },
  "Sunnyvale HOA Commons":                { budget: 14800 },
};

export default function SampleExpenses() {
  const [filter, setFilter] = useState("All Projects");

  const visible = filter === "All Projects"
    ? EXPENSES
    : EXPENSES.filter((e) => e.project === filter);

  const totalVisible = visible.reduce((s, e) => s + e.amount, 0);
  const totalAll     = EXPENSES.reduce((s, e) => s + e.amount, 0);

  // Per-project summaries
  const summaries = Object.entries(BUDGET_MAP).map(([name, { budget }]) => {
    const spent = EXPENSES.filter((e) => e.project === name).reduce((s, e) => s + e.amount, 0);
    const pct   = Math.round((spent / budget) * 100);
    return { name, budget, spent, pct };
  });

  return (
    <DemoShell activeTab="expenses">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="brand-eyebrow mb-1">Spend Tracking</p>
          <h1 className="font-serif text-4xl font-black italic text-brand-cream">Expenses</h1>
        </div>
        <button
          onClick={() => alert("Sign up to log real expenses!")}
          className="btn-brand-orange"
        >
          + Log Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* Left — expense list */}
        <div>
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 mb-5">
            {PROJECTS.map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`font-sans text-[10px] font-semibold tracking-[0.14em] uppercase px-3 py-1.5 border rounded-sm transition-colors ${
                  filter === p
                    ? "bg-brand-cream text-brand-green border-brand-cream"
                    : "bg-transparent text-brand-cream-dim border-brand-cream/25 hover:border-brand-cream/50"
                }`}
              >
                {p === "All Projects" ? "All" : p.split(" ").slice(0, 2).join(" ")}
              </button>
            ))}
          </div>

          {/* Totals bar */}
          <div className="brand-card flex items-center justify-between mb-4 py-4">
            <p className="font-sans text-xs text-brand-cream-dim/60 uppercase tracking-wider">
              {visible.length} expense{visible.length !== 1 ? "s" : ""}
            </p>
            <p className="font-serif font-black text-brand-orange-light text-xl">
              ${totalVisible.toFixed(2)}
            </p>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {visible.map((e) => (
              <div key={e.id} className="brand-card flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Category dot */}
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-sans text-[10px] font-bold ${CATEGORY_COLORS[e.category] ?? "bg-brand-cream/5 text-brand-cream-dim"}`}>
                    {e.category[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="font-sans text-sm font-semibold text-brand-cream truncate">{e.vendor}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`font-sans text-[9px] font-semibold tracking-[0.14em] uppercase px-1.5 py-0.5 rounded-sm ${CATEGORY_COLORS[e.category] ?? ""}`}>
                        {e.category}
                      </span>
                      <span className="font-sans text-[10px] text-brand-cream-dim/40 truncate">{e.project.split(" ").slice(0, 3).join(" ")}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-4">
                  {e.receipt && (
                    <span className="font-sans text-[9px] tracking-wider uppercase text-brand-cream-dim/40 border border-brand-cream/10 px-2 py-0.5 rounded-sm">
                      Receipt
                    </span>
                  )}
                  <div>
                    <p className="font-serif font-bold text-brand-cream text-base">${e.amount.toFixed(2)}</p>
                    <p className="font-sans text-[10px] text-brand-cream-dim/40">{e.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — budget summaries */}
        <div className="space-y-4">
          {/* Total spend card */}
          <div className="brand-card text-center py-6">
            <p className="brand-eyebrow mb-2">Total Logged</p>
            <p className="font-serif text-3xl font-black text-brand-orange-light">${totalAll.toFixed(2)}</p>
            <p className="font-sans text-xs text-brand-cream-dim/50 mt-1">{EXPENSES.length} transactions</p>
          </div>

          {/* Per-project budgets */}
          <div className="brand-card">
            <p className="brand-eyebrow mb-4">Budget vs. Actual</p>
            <div className="space-y-5">
              {summaries.map((s) => (
                <div key={s.name}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="font-sans text-xs font-semibold text-brand-cream leading-tight">{s.name.split(" ").slice(0, 3).join(" ")}</p>
                    <p className={`font-sans text-[10px] font-semibold shrink-0 ${s.pct > 90 ? "text-brand-orange" : "text-brand-cream-dim"}`}>
                      {s.pct}%
                    </p>
                  </div>
                  <div className="h-1.5 bg-brand-cream/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.pct > 90 ? "bg-brand-orange" : "bg-brand-orange-light"}`}
                      style={{ width: `${Math.min(s.pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="font-sans text-[10px] text-brand-cream-dim/40">${s.spent.toLocaleString()} spent</span>
                    <span className="font-sans text-[10px] text-brand-cream-dim/40">${s.budget.toLocaleString()} budget</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown by category */}
          <div className="brand-card">
            <p className="brand-eyebrow mb-4">By Category</p>
            {["Materials", "Subcontractor", "Equipment", "Delivery"].map((cat) => {
              const catTotal = EXPENSES.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
              if (catTotal === 0) return null;
              return (
                <div key={cat} className="flex items-center justify-between py-2 border-b border-brand-cream/10 last:border-0">
                  <span className="font-sans text-xs text-brand-cream-dim">{cat}</span>
                  <span className="font-serif font-bold text-brand-cream text-sm">${catTotal.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="brand-card text-center py-6">
            <p className="font-sans text-xs text-brand-cream-dim mb-4 leading-relaxed">
              Log expenses with receipt photos, filter by project, and export reports.
            </p>
            <Link to="/signup" className="btn-brand-primary">
              Start Tracking →
            </Link>
          </div>
        </div>
      </div>
    </DemoShell>
  );
}
