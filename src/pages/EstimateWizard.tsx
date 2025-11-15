import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEstimate, listAssemblies } from "../lib/api";
import DownloadPdfButton from "../components/DownloadPdfButton";

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

// ✅ Numeric project ID for Option A
const PROJECT_ID = Number(import.meta.env.VITE_DEFAULT_PROJECT_ID ?? 1);

export default function EstimateWizard() {
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [assemblyId, setAssemblyId] = useState<string>("");
  const [area, setArea] = useState<number>(300);
  const [zip, setZip] = useState("94103");
  const [state, setState] = useState("CA");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Load assemblies on mount
  useEffect(() => {
    setError("");
    listAssemblies()
      .then((data) => {
        setAssemblies(data || []);
        if (data?.length) setAssemblyId(data[0].id);
      })
      .catch((e) => setError(e?.message || "Failed to load assemblies"));
  }, []);

  // Keep state uppercase
  function handleStateChange(v: string) {
    setState(v.toUpperCase());
  }

  // Selected assembly (for helper UI)
  const selectedAssembly = useMemo(
    () => assemblies.find((a) => a.id === assemblyId),
    [assemblies, assemblyId]
  );

  // Basic validation
  const canCreate =
    !loading &&
    !!assemblyId &&
    Number.isFinite(area) &&
    area > 0 &&
    state.trim().length > 0 &&
    zip.trim().length > 0;

  async function handleCreate() {
    if (!canCreate) return;
    setLoading(true);
    setError("");
    setEstimate(null);
    try {
      // ✅ Pass numeric projectId
      const est = (await createEstimate({
        projectId: PROJECT_ID,
        location: { zip, state },
        lines: [{ assemblyId, inputs: { area } }],
      })) as Estimate;

      if (!est?.id) {
        throw new Error("Estimate was created but no id was returned.");
      }

      // Store locally so the inline result block can still render if desired
      setEstimate(est);

      // Auto-navigate to the PDF viewer route for a clean proposal experience
      navigate(`/proposals/${est.id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to create estimate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Estimate Wizard</h2>

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
                  ? ` • Waste: ${Math.round(selectedAssembly.wastePct * 100)}%`
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

      {estimate && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="font-medium mb-2">Result</h3>
          <div className="text-sm">
            <div>
              Subtotal: <strong>${Number(estimate.subtotal).toFixed(2)}</strong>
            </div>
            <div>
              Tax: <strong>${Number(estimate.tax).toFixed(2)}</strong>
            </div>
            <div>
              Total: <strong>${Number(estimate.total).toFixed(2)}</strong>
            </div>
          </div>

          {/* Optional transparency: show calculated line items */}
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
                          {it.unitCost.toFixed(2)} = ${it.extended.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-1">
                      Line total:{" "}
                      <strong>${Number(line.lineTotal).toFixed(2)}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Download/Open PDF */}
          <div className="mt-3 flex items-center gap-3">
            <a
              className="inline-block underline text-sm"
              href={`${import.meta.env.VITE_API_BASE_URL}/api/proposals/${estimate.id}.pdf`}
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
