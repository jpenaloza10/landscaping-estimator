import { useEffect, useState } from "react";
import {
  getBudgetReport,
  listExpenses,
  createExpense as createExpenseApi,
  getProjects,
  authedFetch,
  apiRaw,
} from "../lib/api";
import ReceiptUpload from "../components/ReceiptUpload";

const CATEGORIES = [
  "MATERIAL",
  "LABOR",
  "EQUIPMENT",
  "SUBCONTRACTOR",
  "OTHER",
] as const;
type CategoryKey = (typeof CATEGORIES)[number];

export type Project = {
  id: number;
  name: string;
};

export type BudgetReport = {
  hasBaseline: boolean;
  baselineTotal: number;
  totalActual: number;
  totalRemaining: number;
  byCategory?: Partial<Record<CategoryKey, number>>;
  actualByCategory?: Partial<Record<CategoryKey, number>>;
  remainingByCategory?: Partial<Record<CategoryKey, number>>;
};

export type Expense = {
  id: string | number;
  category: string;
  vendor?: string | null;
  description?: string | null;
  amount: number;
  date: string;
};

export default function ExpensesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [report, setReport] = useState<BudgetReport | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState({
    category: "MATERIAL",
    vendor: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(true);

  async function fetchBudgetReportForProject(projectId: number): Promise<BudgetReport> {
    return getBudgetReport(projectId) as Promise<BudgetReport>;
  }

  async function fetchExpensesForProject(projectId: number): Promise<Expense[]> {
    return listExpenses(projectId) as Promise<Expense[]>;
  }

  async function createExpense(payload: {
    projectId: number;
    category: string;
    vendor?: string;
    description?: string;
    amount: number;
    date: string;
  }) {
    return createExpenseApi({
      projectId: payload.projectId,
      category: payload.category,
      vendor: payload.vendor,
      description: payload.description,
      amount: payload.amount,
      date: payload.date,
    });
  }

  async function refresh(projectId: number) {
    setLoading(true);
    try {
      const [r, e] = (await Promise.all([
        fetchBudgetReportForProject(projectId),
        fetchExpensesForProject(projectId),
      ])) as [BudgetReport, Expense[]];
      setReport(r);
      setExpenses(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const ps = (await getProjects()) as Project[];
        setProjects(ps);
        if (ps.length > 0) {
          const firstId = ps[0].id;
          setActiveProjectId(firstId);
          await refresh(firstId);
        } else {
          setActiveProjectId(null);
          setReport(null);
          setExpenses([]);
        }
      } catch (err) {
        console.error("Failed to load projects for expenses page", err);
        setActiveProjectId(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (activeProjectId != null) {
      void refresh(activeProjectId);
    }
  }, [activeProjectId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activeProjectId == null) return;
    await createExpense({
      projectId: activeProjectId,
      category: form.category,
      vendor: form.vendor || undefined,
      description: form.description || undefined,
      amount: Number(form.amount),
      date: form.date,
    });
    setForm((f) => ({ ...f, vendor: "", description: "", amount: "" }));
    await refresh(activeProjectId);
  }

  async function handleAICategorize(id: string | number) {
    if (activeProjectId == null) return;
    try {
      await authedFetch(`/api/expenses/${id}/auto-categorize`, { method: "POST" });
      await refresh(activeProjectId);
    } catch (err) {
      console.error("AI categorization failed", err);
    }
  }

  async function downloadCsv(path: string, filename: string) {
    const res = await apiRaw(path, { method: "GET" });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadExpensesCsv() {
    if (activeProjectId == null) return;
    await downloadCsv(`/api/export/expenses.csv?projectId=${activeProjectId}`, `expenses-project-${activeProjectId}.csv`);
  }

  async function handleDownloadBudgetCsv() {
    if (activeProjectId == null) return;
    await downloadCsv(`/api/export/budget.csv?projectId=${activeProjectId}`, `budget-project-${activeProjectId}.csv`);
  }

  const currentProject =
    activeProjectId != null ? projects.find((p) => p.id === activeProjectId) ?? null : null;

  const selectCls = "brand-input appearance-none cursor-pointer";
  const inputCls  = "brand-input";

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="brand-eyebrow mb-1">Spend Tracking</p>
          <h1 className="font-serif text-4xl font-black italic text-brand-cream">Expenses</h1>
        </div>
      </div>

      {/* Toolbar — project selector + exports */}
      <div className="brand-card flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim">
            Project
          </label>
          <select
            className={`${selectCls} w-56`}
            value={activeProjectId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setActiveProjectId(v ? Number(v) : null);
            }}
          >
            {projects.length === 0 && <option value="">No projects</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-brand-green">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {activeProjectId != null && (
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim">
              Export
            </span>
            <button
              type="button"
              onClick={handleDownloadExpensesCsv}
              className="font-sans text-[10px] font-semibold tracking-wider uppercase text-brand-orange hover:text-brand-orange-light transition-colors underline underline-offset-4"
            >
              Expenses CSV
            </button>
            <button
              type="button"
              onClick={handleDownloadBudgetCsv}
              className="font-sans text-[10px] font-semibold tracking-wider uppercase text-brand-orange hover:text-brand-orange-light transition-colors underline underline-offset-4"
            >
              Budget CSV
            </button>
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">

        {/* Left: Budget snapshot */}
        <section className="brand-card">
          <p className="brand-eyebrow mb-3">Budget Snapshot</p>
          <h2 className="font-serif text-xl font-bold italic text-brand-cream mb-4">
            {currentProject ? currentProject.name : "No project selected"}
          </h2>

          {activeProjectId == null && (
            <p className="font-sans text-sm text-brand-cream-dim/60">
              No projects yet. Create a project first to track expenses.
            </p>
          )}

          {activeProjectId != null && loading && (
            <p className="font-sans text-sm text-brand-cream-dim animate-pulse">Loading…</p>
          )}

          {activeProjectId != null && report && report.hasBaseline && !loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Baseline",  value: `$${report.baselineTotal.toFixed(2)}`, accent: false },
                  { label: "Actual",    value: `$${report.totalActual.toFixed(2)}`,   accent: false },
                  { label: "Remaining", value: `$${report.totalRemaining.toFixed(2)}`, accent: report.totalRemaining < 0 },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="border border-brand-cream/15 p-3 text-center">
                    <p className="font-sans text-[10px] tracking-widest uppercase text-brand-cream-dim mb-1">{label}</p>
                    <p className={`font-serif text-lg font-bold ${accent ? "text-brand-orange" : "text-brand-cream"}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-brand-cream/10">
                <p className="brand-eyebrow mb-2">By Category</p>
                {CATEGORIES.map((cat) => {
                  const b   = report.byCategory?.[cat] ?? 0;
                  const a   = report.actualByCategory?.[cat] ?? 0;
                  const rem = report.remainingByCategory?.[cat] ?? 0;
                  if (b === 0 && a === 0) return null;
                  return (
                    <div key={cat} className="text-xs">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-sans font-semibold text-brand-cream-dim">{cat}</span>
                        <span className={`font-serif font-bold ${rem < 0 ? "text-brand-orange" : "text-brand-cream"}`}>
                          ${rem.toFixed(0)} left
                        </span>
                      </div>
                      <div className="h-1 bg-brand-cream/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${a / b > 0.9 ? "bg-brand-orange" : "bg-brand-orange-light"}`}
                          style={{ width: `${Math.min((a / b) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeProjectId != null && report && !report.hasBaseline && !loading && (
            <p className="font-sans text-sm text-brand-cream-dim/60">
              No baseline yet. Finalize an estimate to create a budget snapshot.
            </p>
          )}
        </section>

        {/* Right: Receipt upload + form + expense list */}
        <section className="brand-card flex flex-col gap-6">
          {activeProjectId == null ? (
            <p className="font-sans text-sm text-brand-cream-dim/60">
              Create a project first to upload receipts and add expenses.
            </p>
          ) : (
            <>
              {/* Receipt upload */}
              <ReceiptUpload
                projectId={String(activeProjectId)}
                onCreated={() => refresh(activeProjectId)}
              />

              {/* Manual expense form */}
              <div>
                <p className="brand-eyebrow mb-3">Log Expense</p>
                <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-1.5">
                      Category
                    </label>
                    <select
                      className={selectCls}
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} className="bg-brand-green">{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-1.5">
                      Vendor
                    </label>
                    <input
                      className={inputCls}
                      placeholder="e.g. Home Depot"
                      value={form.vendor}
                      onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-1.5">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputCls}
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      className={inputCls}
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-1.5">
                      Description (optional)
                    </label>
                    <input
                      className={inputCls}
                      placeholder="Brief description"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="btn-brand-orange"
                      disabled={activeProjectId == null}
                    >
                      + Add Expense
                    </button>
                  </div>
                </form>
              </div>

              {/* Expense list */}
              <div className="border-t border-brand-cream/10 pt-4">
                <p className="brand-eyebrow mb-3">
                  {expenses.length > 0 ? `${expenses.length} Expenses` : "Expenses"}
                </p>
                {loading && (
                  <p className="font-sans text-sm text-brand-cream-dim animate-pulse">Loading…</p>
                )}
                {!loading && expenses.length === 0 && (
                  <p className="font-sans text-sm text-brand-cream-dim/60">No expenses logged yet.</p>
                )}
                <div className="space-y-2">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between gap-3 border-b border-brand-cream/10 pb-2 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="font-sans text-sm font-semibold text-brand-cream truncate">
                          {exp.vendor || exp.category}
                        </p>
                        <p className="font-sans text-xs text-brand-cream-dim/50 truncate">
                          {exp.description || exp.category} · {String(exp.date).slice(0, 10)}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => handleAICategorize(exp.id)}
                          className="font-sans text-[9px] tracking-wider uppercase text-brand-cream-dim/40 border border-brand-cream/10 px-2 py-1 hover:text-brand-orange hover:border-brand-orange/30 transition-colors"
                        >
                          Categorize
                        </button>
                        <p className="font-serif font-bold text-brand-cream text-sm">
                          ${Number(exp.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
