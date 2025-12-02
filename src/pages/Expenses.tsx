import { useEffect, useState } from "react";
import {
  getBudgetReport,
  listExpenses,
  createExpense as createExpenseApi,
  getProjects,
  authedFetch,
  apiRaw, // <- make sure this is exported from lib/api
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

// Local type definitions (since ../lib/api doesn't export these types here)
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

  // --- Fetchers using authed API helpers ---
  async function fetchBudgetReportForProject(
    projectId: number
  ): Promise<BudgetReport> {
    return getBudgetReport(projectId) as Promise<BudgetReport>;
  }

  async function fetchExpensesForProject(
    projectId: number
  ): Promise<Expense[]> {
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
  // --------------------------------------------------

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

  // Load projects on mount and pick a default project for this user
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

  // When the active project changes, reload data
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

  // AI Categorization function (authed)
  async function handleAICategorize(id: string | number) {
    if (activeProjectId == null) return;
    try {
      await authedFetch(`/api/expenses/${id}/auto-categorize`, {
        method: "POST",
      });
      await refresh(activeProjectId);
    } catch (err) {
      console.error("AI categorization failed", err);
    }
  }

  // --- CSV download helpers using apiRaw (includes Authorization header) ---
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
    await downloadCsv(
      `/api/export/expenses.csv?projectId=${activeProjectId}`,
      `expenses-project-${activeProjectId}.csv`
    );
  }

  async function handleDownloadBudgetCsv() {
    if (activeProjectId == null) return;
    await downloadCsv(
      `/api/export/budget.csv?projectId=${activeProjectId}`,
      `budget-project-${activeProjectId}.csv`
    );
  }
  // --------------------------------------------------

  const currentProject =
    activeProjectId != null
      ? projects.find((p) => p.id === activeProjectId) ?? null
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
      {/* Export toolbar + project selector */}
      <div className="lg:col-span-2 flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Project</span>
          <select
            className="rounded border px-2 py-1 text-sm"
            value={activeProjectId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setActiveProjectId(v ? Number(v) : null);
            }}
          >
            {projects.length === 0 && <option value="">No projects</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {activeProjectId != null && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold">Exports</span>

            <button
              type="button"
              onClick={handleDownloadExpensesCsv}
              className="text-xs text-blue-600 underline hover:text-blue-800"
            >
              Download Expenses CSV
            </button>

            <button
              type="button"
              onClick={handleDownloadBudgetCsv}
              className="text-xs text-blue-600 underline hover:text-blue-800"
            >
              Download Budget CSV
            </button>
          </div>
        )}
      </div>

      {/* Left: Budget snapshot */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">
          Budget Snapshot {currentProject ? `– ${currentProject.name}` : ""}
        </h2>
        {activeProjectId == null && (
          <p className="text-sm text-slate-500">
            No projects yet. Create a project first to track expenses.
          </p>
        )}
        {activeProjectId != null && loading && (
          <p className="text-sm text-slate-500">Loading…</p>
        )}
        {activeProjectId != null && report && report.hasBaseline && !loading && (
          <>
            <p className="mb-2 text-sm">
              Baseline: <strong>${report.baselineTotal.toFixed(2)}</strong>
            </p>
            <p className="mb-4 text-sm">
              Actual: <strong>${report.totalActual.toFixed(2)}</strong> •
              Remaining:{" "}
              <strong
                className={
                  report.totalRemaining < 0 ? "text-red-600" : ""
                }
              >
                ${report.totalRemaining.toFixed(2)}
              </strong>
            </p>
            <div className="grid gap-2 text-xs">
              {CATEGORIES.map((cat) => {
                const b = report.byCategory?.[cat] ?? 0;
                const a = report.actualByCategory?.[cat] ?? 0;
                const rem = report.remainingByCategory?.[cat] ?? 0;
                if (b === 0 && a === 0) return null;
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{cat}</span>
                    <span>Budget: ${b.toFixed(0)}</span>
                    <span>Actual: ${a.toFixed(0)}</span>
                    <span
                      className={
                        rem < 0 ? "text-red-600" : "text-slate-700"
                      }
                    >
                      Rem: ${rem.toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {activeProjectId != null && report && !report.hasBaseline && !loading && (
          <p className="text-sm text-slate-500">
            No baseline yet. Finalize an estimate to create a budget snapshot.
          </p>
        )}
      </section>

      {/* Right: Receipt upload + Expense entry + list */}
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
        {activeProjectId == null ? (
          <p className="text-sm text-slate-500">
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
            <form
              onSubmit={onSubmit}
              className="grid items-end gap-2 text-xs sm:grid-cols-5"
            >
              <div className="sm:col-span-1">
                <label className="mb-1 block font-medium">Category</label>
                <select
                  className="w-full rounded border p-2"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block font-medium">Vendor</label>
                <input
                  className="w-full rounded border p-2"
                  value={form.vendor}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vendor: e.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block font-medium">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded border p-2"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block font-medium">Date</label>
                <input
                  type="date"
                  className="w-full rounded border p-2"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <button
                  type="submit"
                  className="w-full rounded bg-slate-900 px-3 py-2 text-white"
                  disabled={activeProjectId == null}
                >
                  Add
                </button>
              </div>
              <div className="sm:col-span-5">
                <label className="mb-1 block font-medium">Description</label>
                <input
                  className="w-full rounded border p-2"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
            </form>

            {/* Expense list */}
            <div className="flex-1 overflow-auto border-t pt-3">
              <h3 className="mb-2 text-sm font-semibold">Expenses</h3>
              <div className="space-y-1 text-xs">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex justify-between gap-2 border-b pb-1"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {exp.vendor || exp.category}
                      </span>
                      <span className="text-slate-500">
                        {exp.description || "No description"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div>${Number(exp.amount).toFixed(2)}</div>
                      <div className="flex items-center justify-end gap-2 text-slate-500">
                        {exp.category} • {String(exp.date).slice(0, 10)}
                        {/* AI Categorize button */}
                        <button
                          onClick={() => handleAICategorize(exp.id)}
                          className="rounded border px-2 py-1 text-[10px] hover:bg-slate-100"
                        >
                          Categorize
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && !loading && (
                  <p className="text-slate-500">No expenses logged yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
