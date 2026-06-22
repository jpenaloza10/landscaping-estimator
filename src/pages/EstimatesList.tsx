import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  listAllEstimates,
  updateEstimateStatus,
  updateEstimateTitle,
  deleteEstimate,
  getProposalPdfUrl,
  ApiError,
  type EstimateSummary,
  type EstimateStatus,
} from "../lib/api";
import DownloadPdfButton from "../components/DownloadPdfButton";
import { useTranslation } from "../i18n/LanguageContext";

const STATUS_STYLE: Record<EstimateStatus, { dot: string; text: string; bg: string }> = {
  DRAFT:    { dot: "bg-brand-cream/40",     text: "text-brand-cream/60",    bg: "bg-brand-cream/5"     },
  SENT:     { dot: "bg-blue-400",           text: "text-blue-300",          bg: "bg-blue-400/10"       },
  APPROVED: { dot: "bg-emerald-400",        text: "text-emerald-300",       bg: "bg-emerald-400/10"    },
  REJECTED: { dot: "bg-brand-orange",       text: "text-brand-orange-light", bg: "bg-brand-orange/10"  },
};

function StatusBadge({ status, label }: { status: EstimateStatus; label: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold tracking-[0.14em] uppercase ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

export default function EstimatesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ── Status config ──────────────────────────────────────────────────────────────
  const STATUS_OPTIONS: { value: EstimateStatus; label: string }[] = [
    { value: "DRAFT",    label: t("estimatesList.statusDraft")    },
    { value: "SENT",     label: t("estimatesList.statusSent")     },
    { value: "APPROVED", label: t("estimatesList.statusApproved") },
    { value: "REJECTED", label: t("estimatesList.statusRejected") },
  ];

  // ── Filter tabs ────────────────────────────────────────────────────────────────
  const FILTERS: { label: string; value: EstimateStatus | "ALL" }[] = [
    { label: t("estimatesList.filterAll"),      value: "ALL"      },
    { label: t("estimatesList.filterDraft"),    value: "DRAFT"    },
    { label: t("estimatesList.filterSent"),     value: "SENT"     },
    { label: t("estimatesList.filterApproved"), value: "APPROVED" },
    { label: t("estimatesList.filterRejected"), value: "REJECTED" },
  ];
  const [estimates, setEstimates]   = useState<EstimateSummary[]>([]);
  const [loading, setLoading]       = useState(true);
  const [err, setErr]               = useState<string | null>(null);
  const [filter, setFilter]         = useState<EstimateStatus | "ALL">("ALL");
  const [updating, setUpdating]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null); // estimateId being renamed
  const [titleDraft, setTitleDraft] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const { estimates: data } = await listAllEstimates();
      setEstimates(data);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setErr(e instanceof Error ? e.message : "Failed to load estimates");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { void load(); }, [load]);

  async function handleStatusChange(estimateId: string, status: EstimateStatus) {
    setUpdating(estimateId);
    try {
      const { estimate: updated } = await updateEstimateStatus(estimateId, status);
      setEstimates((prev) =>
        prev.map((e) => (e.id === estimateId ? { ...e, status: updated.status } : e))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(estimateId: string, title: string) {
    const label = title || `Estimate #${estimateId.slice(-6)}`;
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setDeleting(estimateId);
    try {
      await deleteEstimate(estimateId);
      setEstimates((prev) => prev.filter((e) => e.id !== estimateId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete estimate");
    } finally {
      setDeleting(null);
    }
  }

  function startEditTitle(est: EstimateSummary) {
    setEditingTitle(est.id);
    setTitleDraft(est.title ?? "");
  }

  async function saveTitle(estimateId: string) {
    try {
      await updateEstimateTitle(estimateId, titleDraft.trim());
      setEstimates((prev) =>
        prev.map((e) => e.id === estimateId ? { ...e, title: titleDraft.trim() || null } : e)
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to rename estimate");
    } finally {
      setEditingTitle(null);
    }
  }

  // Filtered + sorted list
  const displayed = estimates.filter(
    (e) => filter === "ALL" || e.status === filter
  );

  const totalValue = estimates.reduce((sum, e) => sum + Number(e.total ?? 0), 0);
  const approvedValue = estimates
    .filter((e) => e.status === "APPROVED")
    .reduce((sum, e) => sum + Number(e.total ?? 0), 0);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-5 w-32 bg-brand-cream/10 rounded" />
        <div className="h-8 w-64 bg-brand-cream/10 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-brand-cream/5 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="brand-eyebrow mb-1">{t("estimatesList.eyebrow")}</p>
          <h1 className="font-serif text-4xl font-black italic text-brand-cream">{t("estimatesList.title")}</h1>
        </div>
        <Link to="/estimate" className="btn-brand-primary shrink-0">
          + New Estimate
        </Link>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("estimatesList.totalEstimates"), value: estimates.length, isCount: true },
          { label: t("estimatesList.totalValue"),     value: totalValue,        isCount: false },
          { label: t("estimatesList.approvedValue"),  value: approvedValue,     isCount: false },
          { label: t("estimatesList.pending"),        value: estimates.filter((e) => e.status === "SENT" || e.status === "DRAFT").length, isCount: true },
        ].map(({ label, value, isCount }) => (
          <div key={label} className="brand-card py-4 text-center">
            <p className="font-sans text-[9px] font-semibold tracking-[0.2em] uppercase text-brand-cream-dim mb-1">
              {label}
            </p>
            <p className="font-serif text-xl font-black italic text-brand-orange-light">
              {isCount ? value : `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(({ label, value }) => {
          const count = value === "ALL"
            ? estimates.length
            : estimates.filter((e) => e.status === value).length;
          const isActive = filter === value;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`font-sans text-[10px] font-semibold tracking-[0.14em] uppercase px-3 py-1.5 rounded-full border transition-colors ${
                isActive
                  ? "bg-brand-orange border-brand-orange text-white"
                  : "border-brand-cream/20 text-brand-cream-dim hover:border-brand-cream/40 hover:text-brand-cream"
              }`}
            >
              {label}
              <span className={`ml-1.5 ${isActive ? "opacity-80" : "opacity-50"}`}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Error ── */}
      {err && (
        <div className="brand-card border-brand-orange/40">
          <p className="font-sans text-sm text-brand-orange">{err}</p>
        </div>
      )}

      {/* ── List ── */}
      {displayed.length === 0 ? (
        <div className="brand-card text-center py-12">
          <p className="font-serif text-2xl italic text-brand-cream/40 mb-2">{t("estimatesList.noEstimates")}</p>
          <p className="font-sans text-xs text-brand-cream-dim mb-6">
            {filter !== "ALL"
              ? `No ${filter.toLowerCase()} estimates found.`
              : "Create your first estimate to get started."}
          </p>
          <Link to="/estimate" className="btn-brand-primary">
            + New Estimate
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((est) => {
            const dateStr = est.createdAt
              ? new Date(est.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })
              : null;

            const projectLabel = est.project
              ? [est.project.name, est.project.city, est.project.state]
                  .filter(Boolean)
                  .join(", ")
              : null;

            const isUpdating = updating === est.id;

            return (
              <div key={est.id} className="brand-card">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Left: meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <StatusBadge status={est.status} label={STATUS_OPTIONS.find((o) => o.value === est.status)?.label ?? est.status} />
                      {dateStr && (
                        <span className="font-sans text-[10px] text-brand-cream-dim tracking-wide">
                          {dateStr}
                        </span>
                      )}
                    </div>

                    {/* Title — click pencil to edit inline */}
                    {editingTitle === est.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          autoFocus
                          className="brand-input py-1 text-sm flex-1"
                          value={titleDraft}
                          onChange={(e) => setTitleDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") void saveTitle(est.id); if (e.key === "Escape") setEditingTitle(null); }}
                          placeholder="Estimate title…"
                        />
                        <button onClick={() => void saveTitle(est.id)} className="font-sans text-[10px] font-semibold tracking-widest uppercase text-emerald-400 hover:text-emerald-300 transition-colors">Save</button>
                        <button onClick={() => setEditingTitle(null)} className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream-dim hover:text-brand-cream transition-colors">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-0.5 group/title">
                        <p className="font-serif text-lg font-bold italic text-brand-cream leading-snug">
                          {est.title || `Estimate #${String(est.id).slice(-6)}`}
                        </p>
                        <button
                          onClick={() => startEditTitle(est)}
                          className="opacity-0 group-hover/title:opacity-100 transition-opacity font-sans text-[9px] tracking-widest uppercase text-brand-cream-dim hover:text-brand-orange"
                          title="Rename"
                        >
                          ✎
                        </button>
                      </div>
                    )}

                    {/* Project link */}
                    {est.project && (
                      <Link
                        to={`/projects/${est.project.id}`}
                        className="font-sans text-[11px] text-brand-cream-dim hover:text-brand-orange transition-colors mt-0.5 inline-block"
                      >
                        {projectLabel}
                      </Link>
                    )}
                  </div>

                  {/* Right: total + status selector */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="text-right">
                      {est.total != null && (
                        <p className="font-serif text-2xl font-black italic text-brand-orange-light">
                          ${Number(est.total).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      )}
                      {est.tax != null && (
                        <p className="font-sans text-[10px] text-brand-cream-dim">
                          incl. ${Number(est.tax).toFixed(2)} tax
                        </p>
                      )}
                    </div>

                    {/* Status selector */}
                    <div className="flex items-center gap-2">
                      <label className="font-sans text-[9px] font-semibold tracking-[0.2em] uppercase text-brand-cream-dim">
                        Status
                      </label>
                      <select
                        disabled={isUpdating}
                        value={est.status}
                        onChange={(e) =>
                          handleStatusChange(est.id, e.target.value as EstimateStatus)
                        }
                        className="bg-transparent border border-brand-cream/25 rounded-sm px-2 py-1 text-brand-cream text-[11px] font-sans font-semibold focus:outline-none focus:border-brand-cream/60 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value} className="bg-[#1B3A1E]">
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {isUpdating && (
                        <span className="font-sans text-[10px] text-brand-cream-dim animate-pulse">
                          Saving…
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action links */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-brand-cream/10">
                  <div className="flex flex-wrap items-center gap-4">
                    <a
                      href={getProposalPdfUrl(est.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream-dim hover:text-brand-orange transition-colors"
                    >
                      {t("estimatesList.pdfLink")}
                    </a>
                    <DownloadPdfButton estimateId={est.id} />
                    <Link
                      to={`/proposals/${est.id}`}
                      className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream-dim hover:text-brand-orange transition-colors"
                    >
                      {t("estimatesList.proposalLink")}
                    </Link>
                    {est.project && (
                      <Link
                        to={`/projects/${est.project.id}`}
                        className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream-dim hover:text-brand-orange transition-colors"
                      >
                        View Project
                      </Link>
                    )}
                  </div>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(est.id, est.title ?? "")}
                    disabled={deleting === est.id}
                    className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream/30 hover:text-red-400 disabled:opacity-40 transition-colors"
                    title="Delete estimate"
                  >
                    {deleting === est.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
