import { useEffect, useState } from "react";
import { getBudgetReport, listExpenses, createExpense } from "../lib/api";
import { API } from "../lib/api"; // ✅ Export endpoints base URL
import ReceiptUpload from "../components/ReceiptUpload";

const PROJECT_ID = "demo-project"; // replace with real selection

const CATEGORIES = ["MATERIAL","LABOR","EQUIPMENT","SUBCONTRACTOR","OTHER"] as const;

export default function ExpensesPage() {
  const [report, setReport] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [form, setForm] = useState({
    category: "MATERIAL",
    vendor: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0,10)
  });
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const [r, e] = await Promise.all([
      getBudgetReport(PROJECT_ID),
      listExpenses(PROJECT_ID)
    ]);
    setReport(r);
    setExpenses(e);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createExpense({
      projectId: PROJECT_ID,
      category: form.category,
      vendor: form.vendor || undefined,
      description: form.description || undefined,
      amount: Number(form.amount),
      date: form.date
    });
    setForm(f => ({ ...f, vendor: "", description: "", amount: "" }));
    await refresh();
  }

  // ✅ AI Categorization function
  async function handleAICategorize(id: string) {
    try {
      await fetch(`${API}/api/expenses/${id}/auto-categorize`, { method: "POST" });
      await refresh();
    } catch (err) {
      console.error("AI categorization failed", err);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
      {/* ✅ Export toolbar (full width) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm lg:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold">Exports</span>
          <a
            href={`${API}/api/export/expenses.csv?projectId=${PROJECT_ID}`}
            className="text-xs underline text-blue-600 hover:text-blue-800"
          >
            Download Expenses CSV
          </a>
          <a
            href={`${API}/api/export/budget.csv?projectId=${PROJECT_ID}`}
            className="text-xs underline text-blue-600 hover:text-blue-800"
          >
            Download Budget CSV
          </a>
        </div>
      </div>

      {/* Left: Budget snapshot */}
      <section className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-semibold mb-2">Budget Snapshot</h2>
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {report && report.hasBaseline && !loading && (
          <>
            <p className="text-sm mb-2">
              Baseline: <strong>${report.baselineTotal.toFixed(2)}</strong>
            </p>
            <p className="text-sm mb-4">
              Actual: <strong>${report.totalActual.toFixed(2)}</strong> • Remaining:{" "}
              <strong className={report.totalRemaining < 0 ? "text-red-600" : ""}>
                ${report.totalRemaining.toFixed(2)}
              </strong>
            </p>
            <div className="grid gap-2 text-xs">
              {CATEGORIES.map(cat => {
                const b = report.byCategory[cat] || 0;
                const a = report.actualByCategory[cat] || 0;
                const rem = report.remainingByCategory[cat] || 0;
                if (b === 0 && a === 0) return null;
                return (
                  <div key={cat} className="flex justify-between items-center">
                    <span className="font-medium">{cat}</span>
                    <span>Budget: ${b.toFixed(0)}</span>
                    <span>Actual: ${a.toFixed(0)}</span>
                    <span className={rem < 0 ? "text-red-600" : "text-slate-700"}>
                      Rem: ${rem.toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {report && !report.hasBaseline && !loading && (
          <p className="text-sm text-slate-500">
            No baseline yet. Finalize an estimate to create a budget snapshot.
          </p>
        )}
      </section>

      {/* Right: Receipt upload + Expense entry + list */}
      <section className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-4">
        <ReceiptUpload
          projectId={PROJECT_ID}
          onCreated={refresh}
        />

        {/* Manual expense form */}
        <form
          onSubmit={onSubmit}
          className="grid gap-2 sm:grid-cols-5 items-end text-xs"
        >
          <div className="sm:col-span-1">
            <label className="block mb-1 font-medium">Category</label>
            <select
              className="w-full border rounded p-2"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block mb-1 font-medium">Vendor</label>
            <input
              className="w-full border rounded p-2"
              value={form.vendor}
              onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block mb-1 font-medium">Amount</label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded p-2"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              required
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block mb-1 font-medium">Date</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required
            />
          </div>
          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full rounded bg-slate-900 text-white px-3 py-2"
            >
              Add
            </button>
          </div>
          <div className="sm:col-span-5">
            <label className="block mb-1 font-medium">Description</label>
            <input
              className="w-full border rounded p-2"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
        </form>

        {/* Expense list */}
        <div className="border-t pt-3 flex-1 overflow-auto">
          <h3 className="font-semibold text-sm mb-2">Expenses</h3>
          <div className="space-y-1 text-xs">
            {expenses.map(exp => (
              <div key={exp.id} className="flex justify-between gap-2 border-b pb-1">
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
                  <div className="text-slate-500 flex items-center justify-end gap-2">
                    {exp.category} • {String(exp.date).slice(0,10)}
                    {/* ✅ AI Categorize button */}
                    <button
                      onClick={() => handleAICategorize(exp.id)}
                      className="text-[10px] border rounded px-2 py-1 hover:bg-slate-100"
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
      </section>
    </div>
  );
}
