import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n/LanguageContext";
import {
  authedFetch,
  updateEstimateStatus,
  listChangeOrders,
  listExpenses,
  createChangeOrder,
  approveChangeOrder,
  rejectChangeOrder,
  deleteProject,
  ApiError,
  type Project,
  type EstimateStatus,
  type ChangeOrder,
} from "../lib/api";

type Estimate = {
  id: string | number;
  title?: string | null;
  status?: EstimateStatus;
  subtotal?: number;
  tax?: number;
  total?: number;
  createdAt?: string;
  created_at?: string;
};

const EST_STATUS_OPTS: { value: EstimateStatus; label: string }[] = [
  { value: "DRAFT",    label: "Draft"    },
  { value: "SENT",     label: "Sent"     },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const EST_STATUS_COLORS: Record<string, string> = {
  DRAFT:    "text-brand-cream/50 border-brand-cream/20",
  SENT:     "text-blue-300 border-blue-400/40",
  APPROVED: "text-emerald-300 border-emerald-400/40",
  REJECTED: "text-brand-orange-light border-brand-orange/40",
};

const CO_STATUS_BADGE: Record<string, string> = {
  PENDING:  "text-yellow-300 border-yellow-400/30 bg-yellow-400/10",
  APPROVED: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  REJECTED: "text-brand-orange-light border-brand-orange/30 bg-brand-orange/10",
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [project,         setProject]         = useState<Project | null>(null);
  const [estimates,       setEstimates]       = useState<Estimate[]>([]);
  const [cos,             setCos]             = useState<ChangeOrder[]>([]);
  const [expensesTotal,   setExpensesTotal]   = useState(0);
  const [loading,         setLoading]         = useState(true);
  const [err,             setErr]             = useState<string | null>(null);

  const [updatingEstId, setUpdatingEstId] = useState<string | null>(null);
  const [updatingCoId,  setUpdatingCoId]  = useState<string | null>(null);

  // ── Change order form state ────────────────────────────────────────────────
  const [showCoForm, setShowCoForm]  = useState(false);
  const [coTitle,    setCoTitle]     = useState("");
  const [coAmount,   setCoAmount]    = useState("");
  const [coDesc,     setCoDesc]      = useState("");
  const [coSaving,   setCoSaving]    = useState(false);
  const [coErr,      setCoErr]       = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true); setErr(null);

        const [projectData, estimatesData, changeOrdersData, expensesData] = await Promise.all([
          authedFetch<Project>(`/api/projects/${id}`, { signal: ac.signal }),
          authedFetch<Estimate[] | { estimates: Estimate[] }>(
            `/api/projects/${id}/estimates`, { signal: ac.signal }
          ).catch(() => []),
          listChangeOrders(Number(id)).catch(() => []),
          listExpenses(Number(id)).catch(() => ({ expenses: [] })),
        ]);

        setProject(projectData);
        const list = Array.isArray(estimatesData)
          ? estimatesData
          : (estimatesData as { estimates: Estimate[] }).estimates ?? [];
        setEstimates(list);
        setCos(changeOrdersData);
        const expList = Array.isArray(expensesData)
          ? expensesData
          : (expensesData as { expenses: Array<{ amount: number }> }).expenses ?? [];
        setExpensesTotal(expList.reduce((s, e) => s + Number(e.amount ?? 0), 0));
      } catch (e: unknown) {
        if ((e as { name?: string })?.name === "AbortError") return;
        if (e instanceof ApiError && e.status === 401) { navigate("/login", { replace: true }); return; }
        if (e instanceof ApiError && e.status === 404)  { setErr(t("projectDetail.notFound")); return; }
        setErr(e instanceof Error ? e.message : t("projectDetail.loadFailed"));
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [id, navigate, t]);

  async function handleEstimateStatusChange(estimateId: string, status: EstimateStatus) {
    setUpdatingEstId(estimateId);
    try {
      const { estimate: updated } = await updateEstimateStatus(estimateId, status);
      setEstimates((prev) => prev.map((e) => String(e.id) === estimateId ? { ...e, status: updated.status } : e));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdatingEstId(null);
    }
  }

  async function handleCoAction(coId: string, action: "approve" | "reject") {
    setUpdatingCoId(coId);
    try {
      const updated = action === "approve"
        ? await approveChangeOrder(coId)
        : await rejectChangeOrder(coId);
      setCos((prev) => prev.map((co) => co.id === coId ? updated : co));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setUpdatingCoId(null);
    }
  }

  async function handleDeleteProject() {
    if (!project) return;
    if (!window.confirm(`Delete "${project.name}"?\n\nThis will permanently remove the project and all its estimates, expenses, and change orders.`)) return;
    try {
      await deleteProject(project.id);
      navigate("/projects", { replace: true });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete project");
    }
  }

  async function handleCreateCo(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !coTitle.trim() || !coAmount) return;
    setCoSaving(true); setCoErr(null);
    try {
      const co = await createChangeOrder({
        projectId:   project.id,
        title:       coTitle.trim(),
        description: coDesc.trim() || undefined,
        amount:      Number(coAmount),
      });
      setCos((prev) => [co, ...prev]);
      setCoTitle(""); setCoAmount(""); setCoDesc(""); setShowCoForm(false);
    } catch (err) {
      setCoErr(err instanceof Error ? err.message : "Failed to create change order");
    } finally {
      setCoSaving(false);
    }
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const approvedCoTotal = cos
    .filter((co) => co.status === "APPROVED")
    .reduce((s, co) => s + Number(co.amount), 0);

  const estimatesTotal = estimates.reduce((s, e) => s + Number(e.total ?? 0), 0);
  const contractValue  = estimatesTotal + approvedCoTotal;
  const grossProfit    = contractValue - expensesTotal;
  const profitMargin   = contractValue > 0 ? (grossProfit / contractValue) * 100 : 0;
  const marginColor    = profitMargin >= 20 ? "text-emerald-400" : profitMargin >= 10 ? "text-brand-orange-light" : "text-brand-orange";

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-5 w-32 bg-brand-cream/10 rounded" />
        <div className="h-8 w-64 bg-brand-cream/10 rounded" />
        <div className="h-4 w-48 bg-brand-cream/10 rounded" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="brand-card border-brand-orange/40">
        <p className="brand-eyebrow mb-1">{t("common.error")}</p>
        <p className="font-sans text-sm text-brand-cream-dim mt-1">{err}</p>
        <Link to="/projects" className="font-sans text-xs text-brand-cream-dim underline underline-offset-2 mt-3 inline-block hover:text-brand-orange">
          ← Back to projects
        </Link>
      </div>
    );
  }

  if (!project) return null;

  const labelClass = "block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-2";

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <Link to="/projects" className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream-dim hover:text-brand-orange transition-colors">
          {t("projectDetail.backToProjects")}
        </Link>
        <div className="flex items-start justify-between gap-4 mt-3">
          <div>
            <p className="brand-eyebrow mb-1">{t("projectDetail.eyebrow")}</p>
            <h1 className="font-serif text-4xl font-black italic text-brand-cream">{project.name}</h1>
            {project.location && <p className="font-sans text-sm text-brand-cream-dim mt-1">{project.location}</p>}
            {project.description && <p className="font-sans text-xs text-brand-cream-dim/70 mt-2 leading-relaxed max-w-lg">{project.description}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to={`/estimate?projectId=${project.id}`} className="btn-brand-primary">
              {t("projectDetail.newEstimate")}
            </Link>
            <button
              onClick={() => void handleDeleteProject()}
              className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream/30 hover:text-red-400 transition-colors border border-brand-cream/15 hover:border-red-400/40 px-3 py-2"
              title="Delete project"
            >
              Delete Project
            </button>
          </div>
        </div>
      </div>

      {/* ── Financial summary strip ── */}
      {(estimates.length > 0 || cos.length > 0 || expensesTotal > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: t("projectDetail.estimatesTotal"),  value: estimatesTotal,  color: "text-brand-orange-light" },
            { label: t("projectDetail.approvedCOs"),     value: approvedCoTotal, color: "text-brand-orange-light" },
            { label: t("projectDetail.contractValue"),   value: contractValue,   color: "text-brand-cream"        },
            { label: t("projectDetail.expenses"),        value: expensesTotal,   color: "text-brand-cream"        },
            { label: t("projectDetail.grossProfit"),     value: grossProfit,     color: grossProfit < 0 ? "text-brand-orange" : "text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="brand-card py-3 text-center">
              <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-brand-cream-dim mb-1">{label}</p>
              <p className={`font-serif text-lg font-black italic ${color}`}>
                ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </p>
            </div>
          ))}
        </div>
      )}
      {/* ── Profit margin indicator ── */}
      {contractValue > 0 && (
        <div className="brand-card py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-brand-cream-dim mb-0.5">
                {t("projectDetail.profitMargin")}
              </p>
              <p className={`font-serif text-2xl font-black italic ${marginColor}`}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
            {/* Progress bar */}
            <div className="flex-1 max-w-xs">
              <div className="h-1.5 bg-brand-cream/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${profitMargin >= 20 ? "bg-emerald-400" : profitMargin >= 10 ? "bg-brand-orange-light" : "bg-brand-orange"}`}
                  style={{ width: `${Math.min(Math.max(profitMargin, 0), 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-sans text-[9px] text-brand-cream-dim">0%</span>
                <span className="font-sans text-[9px] text-brand-cream-dim">20%</span>
                <span className="font-sans text-[9px] text-brand-cream-dim">40%+</span>
              </div>
            </div>
            <Link to="/expenses" className="shrink-0 font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream-dim hover:text-brand-orange transition-colors">
              {t("projectDetail.trackExpenses")}
            </Link>
          </div>
        </div>
      )}

      {/* ── Estimates ── */}
      <div className="brand-card">
        <p className="brand-eyebrow mb-4">{t("projectDetail.estimatesSection")}</p>

        {estimates.length === 0 ? (
          <p className="font-sans text-xs text-brand-cream-dim">{t("projectDetail.noEstimates")}</p>
        ) : (
          <ul className="divide-y divide-brand-cream/10">
            {estimates.map((est) => {
              const estId      = String(est.id);
              const isUpdating = updatingEstId === estId;
              const status     = (est.status ?? "DRAFT") as EstimateStatus;
              const colorClass = EST_STATUS_COLORS[status] ?? EST_STATUS_COLORS.DRAFT;

              return (
                <li key={estId} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-base font-bold italic text-brand-cream leading-snug">
                        {est.title || `Estimate #${estId.slice(-6)}`}
                      </p>
                      {(est.createdAt ?? est.created_at) && (
                        <p className="font-sans text-[10px] text-brand-cream-dim mt-0.5 tracking-wide">
                          {new Date((est.createdAt ?? est.created_at)!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {est.total != null && (
                        <p className="font-serif text-lg font-black italic text-brand-orange-light">
                          ${Number(est.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                      <select
                        disabled={isUpdating}
                        value={status}
                        onChange={(e) => handleEstimateStatusChange(estId, e.target.value as EstimateStatus)}
                        className={`bg-transparent border rounded-sm px-2 py-1 text-[10px] font-sans font-semibold tracking-wide uppercase focus:outline-none focus:border-brand-cream/60 transition-colors disabled:opacity-50 cursor-pointer ${colorClass}`}
                      >
                        {EST_STATUS_OPTS.map((o) => (
                          <option key={o.value} value={o.value} className="bg-[#1B3A1E] text-brand-cream normal-case">{o.label}</option>
                        ))}
                      </select>
                      {isUpdating && <span className="font-sans text-[10px] text-brand-cream-dim animate-pulse">…</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Change Orders ── */}
      <div className="brand-card">
        <div className="flex items-center justify-between mb-4">
          <p className="brand-eyebrow">{t("projectDetail.changeOrdersSection")}</p>
          <button
            onClick={() => setShowCoForm((v) => !v)}
            className="font-sans text-[10px] font-semibold tracking-widest uppercase border border-brand-cream/20 px-3 py-1.5 text-brand-cream-dim hover:border-brand-orange hover:text-brand-orange transition-colors"
          >
            {showCoForm ? t("projectDetail.cancelAdd") : t("projectDetail.addChangeOrder")}
          </button>
        </div>

        {/* Create form */}
        {showCoForm && (
          <form onSubmit={handleCreateCo} className="mb-6 p-4 border border-brand-cream/15 bg-brand-cream/5 space-y-4">
            <p className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-orange">{t("projectDetail.newChangeOrderLabel")}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("common.title")}</label>
                <input className="brand-input" value={coTitle} onChange={(e) => setCoTitle(e.target.value)} placeholder="e.g. Add retaining wall" required />
              </div>
              <div>
                <label className={labelClass}>{t("projectDetail.amountLabel")}</label>
                <input className="brand-input" type="number" step="0.01" value={coAmount} onChange={(e) => setCoAmount(e.target.value)} placeholder="e.g. 2400.00" required />
              </div>
            </div>
            <div>
              <label className={labelClass}>{t("projectDetail.descriptionLabel")} <span className="normal-case font-normal opacity-50">(optional)</span></label>
              <input className="brand-input" value={coDesc} onChange={(e) => setCoDesc(e.target.value)} placeholder={t("projectDetail.descriptionPlaceholder")} />
            </div>
            {coErr && <p className="font-sans text-xs text-brand-orange">{coErr}</p>}
            <button type="submit" disabled={coSaving} className="btn-brand-primary disabled:opacity-40">
              {coSaving ? t("projectDetail.saving") : t("projectDetail.createChangeOrder")}
            </button>
          </form>
        )}

        {/* List */}
        {cos.length === 0 ? (
          <p className="font-sans text-xs text-brand-cream-dim">{t("projectDetail.noChangeOrders")}</p>
        ) : (
          <ul className="divide-y divide-brand-cream/10">
            {cos.map((co) => {
              const isUpdating   = updatingCoId === co.id;
              const badgeClass   = CO_STATUS_BADGE[co.status] ?? CO_STATUS_BADGE.PENDING;
              const isPending    = co.status === "PENDING";

              return (
                <li key={co.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 border font-sans text-[9px] font-semibold tracking-widest uppercase rounded-sm ${badgeClass}`}>
                          {co.status}
                        </span>
                      </div>
                      <p className="font-serif text-sm font-bold italic text-brand-cream">{co.title}</p>
                      {co.description && (
                        <p className="font-sans text-[11px] text-brand-cream-dim mt-0.5">{co.description}</p>
                      )}
                      {co.createdAt && (
                        <p className="font-sans text-[10px] text-brand-cream/40 mt-1">
                          {new Date(co.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`font-serif text-lg font-black italic ${Number(co.amount) >= 0 ? "text-brand-orange-light" : "text-brand-orange"}`}>
                        {Number(co.amount) >= 0 ? "+" : ""}${Math.abs(Number(co.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>

                      {isPending && (
                        <div className="flex items-center gap-2 mt-2 justify-end">
                          <button
                            disabled={isUpdating}
                            onClick={() => handleCoAction(co.id, "approve")}
                            className="font-sans text-[10px] font-semibold tracking-widest uppercase px-2 py-1 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10 transition-colors disabled:opacity-50"
                          >
                            {t("common.approve")}
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => handleCoAction(co.id, "reject")}
                            className="font-sans text-[10px] font-semibold tracking-widest uppercase px-2 py-1 border border-brand-orange/40 text-brand-orange-light hover:bg-brand-orange/10 transition-colors disabled:opacity-50"
                          >
                            {t("common.reject")}
                          </button>
                          {isUpdating && <span className="font-sans text-[10px] text-brand-cream-dim animate-pulse">…</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="font-sans text-[10px] tracking-widest uppercase text-brand-cream-dim/40">
        Created {new Date(project.created_at).toLocaleString()}
      </p>
    </div>
  );
}
