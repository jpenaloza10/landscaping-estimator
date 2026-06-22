import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  listAllEstimates,
  updateEstimateStatus,
  getProposalPdfUrl,
  ApiError,
  type EstimateSummary,
  type EstimateStatus,
} from "../lib/api";
import DownloadPdfButton from "../components/DownloadPdfButton";

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: EstimateStatus; label: string }[] = [
  { value: "DRAFT",    label: "Draft"    },
  { value: "SENT",     label: "Sent"     },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_STYLE: Record<EstimateStatus, { dot: string; text: string; bg: string }> = {
  DRAFT:    { dot: "bg-brand-cream/40",     text: "text-brand-cream/60",    bg: "bg-brand-cream/5"     },
  SENT:     { dot: "bg-blue-400",           text: "text-blue-300",          bg: "bg-blue-400/10"       },
  APPROVED: { dot: "bg-emerald-400",        text: "text-emerald-300",       bg: "bg-emerald-400/10"    },
  REJECTED: { dot: "bg-brand-orange",       text: "text-brand-orange-light", bg: "bg-brand-orange/10"  },
};

function StatusBadge({ status }: { status: EstimateStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold tracking-[0.14em] uppercase ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status}
    </span>
  );
}

// ── Filter tabs ────────────────────────────────────────────────────────────────
const FILTERS: { label: string; value: EstimateStatus | "ALL" }[] = [
  { label: "All",      value: "ALL"      },
  { label: "Draft",    value: "DRAFT"    },
  { label: "Sent",     value: "SENT"     },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function EstimatesList() {
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState<EstimateSummary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState<string | null>(null);
  const [filter, setFilter]       = useState<EstimateStatus | "ALL">("ALL");
  const [updating, setUpdating]   = useState<string | null>(null); // estimateId being updated

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
          <p className="brand-eyebrow mb-1">All</p>
          <h1 className="font-serif text-4xl font-black italic text-brand-cream">Estimates</h1>
        </div>
        <Link to="/estimate" className="btn-brand-primary shrink-0">
          + New Estimate
        </Link>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Estimates", value: estimates.length, isCount: true },
          { label: "Total Value",     value: totalValue,        isCount: false },
          { label: "Approved Value",  value: approvedValue,     isCount: false },
          { label: "Pending",         value: estimates.filter((e) => e.status === "SENT" || e.status === "DRAFT").length, isCount: true },
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
          <p className="font-serif text-2xl italic text-brand-cream/40 mb-2">No estimates yet</p>
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
                      <StatusBadge status={est.status} />
                      {dateStr && (
                        <span className="font-sans text-[10px] text-brand-cream-dim tracking-wide">
                          {dateStr}
                        </span>
                      )}
                    </div>

                    {/* Title or fallback ID */}
                    <p className="font-serif text-lg font-bold italic text-brand-cream leading-snug">
                      {est.title || `Estimate #${String(est.id).slice(-6)}`}
                    </p>

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
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-brand-cream/10">
                  <a
                    href={getProposalPdfUrl(est.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream-dim hover:text-brand-orange transition-colors"
                  >
                    Open PDF ↗
                  </a>
                  <DownloadPdfButton estimateId={est.id} />
                  <Link
                    to={`/proposals/${est.id}`}
                    className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream-dim hover:text-brand-orange transition-colors"
                  >
                    View Proposal
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
