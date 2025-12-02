import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createEstimate,
  listAssemblies,
  getProjects,
  type Project,
  getProposalPdfUrl,
} from "../lib/api";
import DownloadPdfButton from "../components/DownloadPdfButton";

// AI Assistant Panel (Sprint 6)
import AiAssistantPanel from "../components/AiAssistantPanel";
import { useAuth } from "../hooks/useAuth";

type AssemblyItem = {
  id: string;
  name: string;
  unit: string;
  unitCost: number;
  qtyFormula: string;
};

type Assembly = {
  id: string;
  name: string;
  unit?: string;
  wastePct?: number;
  items: AssemblyItem[];
};

type EstimateItem = {
  name: string;
  unit: string;
  unitCost: number;
  qty: number;
  extended: number;
};

type EstimateLine = {
  id: string;
  assemblyId: string;
  inputs: Record<string, number>;
  items: EstimateItem[];
  lineTotal: number;
  notes?: string;
};

type Estimate = {
  id: string;
  subtotal: number;
  tax: number;
  total: number;
  lines: EstimateLine[];
  location?: any;
};

export default function EstimateWizard() {
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [assemblyId, setAssemblyId] = useState<string>("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  const [area, setArea] = useState<number>(300);
  const [zip, setZip] = useState("94103");
  const [state, setState] = useState("CA");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Auth token for AI routes
  const { token } = useAuth();

  // Load assemblies + projects on mount
  useEffect(() => {
    setError("");
    (async () => {
      try {
        const [assembliesData, projectsData] = await Promise.all([
          listAssemblies(),
          getProjects(),
        ]);

        setAssemblies(assembliesData || []);
        if (assembliesData?.length) setAssemblyId(assembliesData[0].id);

        setProjects(projectsData || []);
        if (projectsData?.length && activeProjectId == null) {
          setActiveProjectId(projectsData[0].id);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load assemblies or projects");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep state uppercase
  function handleStateChange(v: string) {
    setState(v.toUpperCase());
  }

  const selectedAssembly = useMemo(
    () => assemblies.find((a) => a.id === assemblyId),
    [assemblies, assemblyId]
  );

  const canCreate =
    !loading &&
    !!assemblyId &&
    activeProjectId != null &&
    Number.isFinite(area) &&
    area > 0 &&
    state.trim().length > 0 &&
    zip.trim().length > 0;

  async function handleCreate() {
    if (!canCreate || activeProjectId == null) return;
    setLoading(true);
    setError("");
    setEstimate(null);

    try {
      const est = (await createEstimate({
        projectId: activeProjectId, // 🔐 project owned by current user
        location: { zip, state },
        lines: [{ assemblyId, inputs: { area } }],
      })) as Estimate;

      if (!est?.id) {
        throw new Error("Estimate was created but no id was returned.");
      }

      setEstimate(est);

      // Navigate to proposal page; AI panel still visible on this screen
      navigate(`/proposals/${est.id}`);
    } catch (e: any) {
      const msg =
        e?.payload?.error ||
        e?.message ||
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

  return (
    <div className="grid gap-4">
      {/* Wizard input card */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Estimate Wizard</h2>

        {/* Project selector */}
        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="font-medium">Project</span>
            <select
              className="border rounded px-2 py-1"
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
          </label>
          {currentProject && (
            <span className="text-xs text-slate-500">
              Creating estimate for: <strong>{currentProject.name}</strong>
            </span>
          )}
          {projects.length === 0 && (
            <span className="text-xs text-red-600">
              No projects yet. Create a project first.
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Assembly
            <select
              className="mt-1 w-full border rounded p-2"
              value={assemblyId}
              onChange={(e) => setAssemblyId(e.target.value)}
            >
              {assemblies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {selectedAssembly && (
              <div className="mt-1 text-xs text-slate-500">
                Items: {selectedAssembly.items?.length ?? 0}
                {typeof selectedAssembly.wastePct === "number"
                  ? ` • Waste: ${Math.round(
                      (selectedAssembly.wastePct || 0) * 100
                    )}%`
                  : ""}
                {selectedAssembly.unit ? ` • Unit: ${selectedAssembly.unit}` : ""}
              </div>
            )}
          </label>

          <label className="text-sm">
            Area (sqft)
            <input
              className="mt-1 w-full border rounded p-2"
              type="number"
              min={0}
              value={area}
              onChange={(e) => setArea(Math.max(0, Number(e.target.value)))}
            />
            <span className="block mt-1 text-xs text-slate-500">
              Enter the measured area for this assembly line.
            </span>
          </label>

          <label className="text-sm">
            State
            <input
              className="mt-1 w-full border rounded p-2"
              value={state}
              onChange={(e) => handleStateChange(e.target.value)}
              placeholder="CA"
            />
          </label>

          <label className="text-sm">
            ZIP
            <input
              className="mt-1 w-full border rounded p-2"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="94103"
            />
          </label>
        </div>

        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className="mt-4 rounded bg-slate-900 text-white px-3 py-2 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Estimate"}
        </button>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Result + AI Assistant */}
      {estimate && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          {/* AI Assistant Panel */}
          {token && (
            <div className="mb-6">
              <AiAssistantPanel estimateId={estimate.id} token={token} />
            </div>
          )}

          <h3 className="font-medium mb-2">Result</h3>
          <div className="text-sm">
            <div>
              Subtotal:{" "}
              <strong>${Number(estimate.subtotal ?? 0).toFixed(2)}</strong>
            </div>
            <div>
              Tax: <strong>${Number(estimate.tax ?? 0).toFixed(2)}</strong>
            </div>
            <div>
              Total: <strong>${Number(estimate.total ?? 0).toFixed(2)}</strong>
            </div>
          </div>

          {!!estimate.lines?.length && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-sm">Line Items</h4>
              <ul className="text-sm">
                {estimate.lines.map((line) => (
                  <li key={line.id ?? line.assemblyId} className="border-t py-2">
                    <div className="text-slate-700">
                      Assembly:{" "}
                      <span className="font-medium">{line.assemblyId}</span>
                    </div>
                    <ul className="pl-4 list-disc">
                      {line.items?.map((it, idx) => (
                        <li key={idx} className="text-slate-600">
                          {it.name}: {it.qty.toFixed(2)} {it.unit} @ $
                          {it.unitCost.toFixed(2)} = $
                          {it.extended.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-1">
                      Line total:{" "}
                      <strong>${Number(line.lineTotal ?? 0).toFixed(2)}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <a
              className="inline-block underline text-sm"
              href={getProposalPdfUrl(String(estimate.id))}
              target="_blank"
              rel="noreferrer"
            >
              Open Proposal PDF
            </a>
            <DownloadPdfButton estimateId={estimate.id} />
          </div>
        </div>
      )}
    </div>
  );
}
