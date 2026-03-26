import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createEstimate,
  listAssemblies,
  getProjects,
  getProposalPdfUrl,
} from "../lib/api";
import DownloadPdfButton from "../components/DownloadPdfButton";
import AiAssistantPanel from "../components/AiAssistantPanel";

export type Project = {
  id: number;
  name: string;
};

export type Assembly = {
  id: string | number;
  name: string;
  unit?: string | null;
  items?: unknown[]; // only used for .length in this component
  wastePct?: number | null;
};

export type EstimateItem = {
  name: string;
  qty: number;
  unit: string;
  unitCost: number;
  extended: number;
};

export type EstimateLine = {
  id?: string | number;
  assemblyId: string | number;
  items?: EstimateItem[];
  lineTotal?: number;
};

export type Estimate = {
  id: string | number;
  subtotal?: number;
  tax?: number;
  total?: number;
  lines?: EstimateLine[];
};

export default function EstimateWizard() {
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [assemblyId, setAssemblyId] = useState<string>("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  const [area, setArea] = useState<number>(0);
  const [zip, setZip] = useState("");
  const [state, setState] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load assemblies + projects on mount
  useEffect(() => {
    setError("");
    (async () => {
      try {
        const [assembliesData, projectsData] = await Promise.all([
          listAssemblies() as Promise<Assembly[]>,
          getProjects() as Promise<Project[]>,
        ]);

        setAssemblies(assembliesData ?? []);
        if (assembliesData?.length) {
          // Ensure we store assemblyId as a string for the <select>
          setAssemblyId(String(assembliesData[0].id));
        }

        setProjects(projectsData ?? []);
        if (projectsData?.length && activeProjectId == null) {
          setActiveProjectId(projectsData[0].id);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load assemblies or projects");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStateChange(v: string) {
    setState(v.toUpperCase());
  }

  const selectedAssembly = useMemo(
    () =>
      assemblies.find((a) => String(a.id) === String(assemblyId)) ?? null,
    [assemblies, assemblyId]
  );

  // Build a name-lookup map for rendering estimate results
  const assemblyNameById = useMemo(
    () => new Map(assemblies.map((a) => [String(a.id), a.name])),
    [assemblies]
  );

  const ZIP_RE = /^\d{5}(-\d{4})?$/;
  const STATE_RE = /^[A-Z]{2}$/;

  const canCreate =
    !loading &&
    !!assemblyId &&
    activeProjectId != null &&
    Number.isFinite(area) &&
    area > 0 &&
    STATE_RE.test(state.trim()) &&
    ZIP_RE.test(zip.trim());

  async function handleCreate() {
    if (!canCreate || activeProjectId == null) return;
    setLoading(true);
    setError("");
    setEstimate(null);

    try {
      const est = (await createEstimate({
        projectId: activeProjectId,
        location: { zip, state },
        lines: [{ assemblyId, inputs: { area } }],
      })) as Estimate;

      if (!est?.id) {
        throw new Error("Estimate was created but no id was returned.");
      }

      setEstimate(est);
    } catch (e: unknown) {
      const apiErr = e as { payload?: { error?: string }; message?: string };
      const msg =
        apiErr?.payload?.error ||
        (e instanceof Error ? e.message : null) ||
        "Failed to create estimate";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const currentProject =
    activeProjectId != null
      ? projects.find((p) => p.id === activeProjectId) ?? null
      : null;

  const labelClass = "block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-2";
  const selectClass = "w-full bg-transparent border border-brand-cream/30 rounded-sm px-3 py-2 text-brand-cream text-sm font-sans focus:outline-none focus:border-brand-cream/70 transition-colors";

  return (
    <div className="space-y-6">
      {/* ── Wizard input ── */}
      <div className="brand-card">
        <p className="brand-eyebrow mb-1">Build Your</p>
        <h2 className="font-serif text-3xl font-black italic text-brand-cream mb-6">Estimate</h2>

        {/* Project selector */}
        <div className="mb-5">
          <label className={labelClass}>Project</label>
          <select
            className={selectClass}
            value={activeProjectId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setActiveProjectId(v ? Number(v) : null);
            }}
          >
            {projects.length === 0 && <option value="">No projects</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {projects.length === 0 && (
            <p className="font-sans text-[11px] text-brand-orange mt-2">
              No projects yet —{" "}
              <Link to="/projects/new" className="underline underline-offset-2">create one first</Link>.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Assembly */}
          <div>
            <label className={labelClass}>Assembly</label>
            <select
              className={selectClass}
              value={assemblyId}
              onChange={(e) => setAssemblyId(e.target.value)}
            >
              {assemblies.map((a) => (
                <option key={a.id} value={String(a.id)}>{a.name}</option>
              ))}
            </select>
            {selectedAssembly && (
              <p className="font-sans text-[10px] text-brand-cream-dim/60 mt-1.5 tracking-wide">
                {selectedAssembly.items?.length ?? 0} items
                {typeof selectedAssembly.wastePct === "number"
                  ? ` · ${Math.round((selectedAssembly.wastePct || 0) * 100)}% waste`
                  : ""}
                {selectedAssembly.unit ? ` · ${selectedAssembly.unit}` : ""}
              </p>
            )}
          </div>

          {/* Area */}
          <div>
            <label className={labelClass}>Area (sqft)</label>
            <input
              className="brand-input"
              type="number"
              min={1}
              placeholder="e.g. 300"
              value={area === 0 ? "" : area}
              onChange={(e) => setArea(Math.max(0, Number(e.target.value)))}
            />
          </div>

          {/* State */}
          <div>
            <label className={labelClass}>State</label>
            <input
              className="brand-input"
              value={state}
              onChange={(e) => handleStateChange(e.target.value)}
              placeholder="e.g. CA"
              maxLength={2}
            />
          </div>

          {/* ZIP */}
          <div>
            <label className={labelClass}>ZIP Code</label>
            <input
              className="brand-input"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="e.g. 94103"
              maxLength={10}
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className="btn-brand-primary mt-6 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Creating…" : "Create Estimate"}
        </button>

        {error && (
          <p className="font-sans text-xs text-brand-orange border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 rounded-sm mt-4">
            {error}
          </p>
        )}
      </div>

      {/* ── Results ── */}
      {estimate && (
        <div className="brand-card space-y-6">
          <div className="mb-2">
            <AiAssistantPanel estimateId={String(estimate.id)} />
          </div>

          <div>
            <p className="brand-eyebrow mb-3">Result</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Subtotal", value: estimate.subtotal ?? 0 },
                { label: "Tax",      value: estimate.tax      ?? 0 },
                { label: "Total",    value: estimate.total    ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="border border-brand-cream/15 p-3">
                  <p className="font-sans text-[10px] tracking-widest uppercase text-brand-cream-dim mb-1">{label}</p>
                  <p className={`font-serif font-black italic ${label === "Total" ? "text-xl text-brand-orange-light" : "text-base text-brand-cream"}`}>
                    ${Number(value).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {!!estimate.lines?.length && (
            <div>
              <p className="brand-eyebrow mb-3">Line Items</p>
              <ul className="divide-y divide-brand-cream/10">
                {estimate.lines.map((line) => (
                  <li key={String(line.id ?? line.assemblyId)} className="py-3 first:pt-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-serif text-sm font-bold italic text-brand-cream">
                        {assemblyNameById.get(String(line.assemblyId)) ?? String(line.assemblyId)}
                      </p>
                      <p className="font-serif text-sm font-bold italic text-brand-orange-light">
                        ${Number(line.lineTotal ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <ul className="space-y-1">
                      {line.items?.map((it, idx) => (
                        <li key={idx} className="font-sans text-[11px] text-brand-cream-dim flex justify-between">
                          <span>{it.name}: {it.qty.toFixed(2)} {it.unit} @ ${it.unitCost.toFixed(2)}</span>
                          <span>${it.extended.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-brand-cream/10">
            <a
              className="font-sans text-[11px] font-semibold tracking-widest uppercase text-brand-cream-dim underline underline-offset-2 hover:text-brand-orange transition-colors"
              href={getProposalPdfUrl(String(estimate.id))}
              target="_blank"
              rel="noreferrer"
            >
              Open PDF ↗
            </a>
            <DownloadPdfButton estimateId={String(estimate.id)} />
            <Link
              to={`/proposals/${estimate.id}`}
              className="font-sans text-[11px] font-semibold tracking-widest uppercase text-brand-cream-dim underline underline-offset-2 hover:text-brand-orange transition-colors"
            >
              View Proposal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
