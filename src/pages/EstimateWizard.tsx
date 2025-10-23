import { useState } from "react";
import { createEstimate, listAssemblies } from "../lib/api";
import { useEffect } from "react";

export default function EstimateWizard() {
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [assemblyId, setAssemblyId] = useState<string>("");
  const [area, setArea] = useState<number>(300);
  const [zip, setZip] = useState("94103");
  const [state, setState] = useState("CA");
  const [estimate, setEstimate] = useState<any>(null);

  useEffect(() => { listAssemblies().then(setAssemblies); }, []);
  useEffect(() => { if (assemblies[0]) setAssemblyId(assemblies[0].id); }, [assemblies]);

  async function handleCreate() {
    const est = await createEstimate({
      projectId: "demo-project",
      location: { zip, state },
      lines: [{ assemblyId, inputs: { area } }]
    });
    setEstimate(est);
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Estimate Wizard</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Assembly
            <select className="mt-1 w-full border rounded p-2" value={assemblyId} onChange={e=>setAssemblyId(e.target.value)}>
              {assemblies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="text-sm">
            Area (sqft)
            <input className="mt-1 w-full border rounded p-2" type="number" value={area} onChange={e=>setArea(Number(e.target.value))}/>
          </label>
          <label className="text-sm">
            State
            <input className="mt-1 w-full border rounded p-2" value={state} onChange={e=>setState(e.target.value.toUpperCase())}/>
          </label>
          <label className="text-sm">
            ZIP
            <input className="mt-1 w-full border rounded p-2" value={zip} onChange={e=>setZip(e.target.value)}/>
          </label>
        </div>

        <button onClick={handleCreate} className="mt-4 rounded bg-slate-900 text-white px-3 py-2">Create Estimate</button>
      </div>

      {estimate && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="font-medium mb-2">Result</h3>
          <div className="text-sm">Subtotal: ${Number(estimate.subtotal).toFixed(2)}</div>
          <div className="text-sm">Tax: ${Number(estimate.tax).toFixed(2)}</div>
          <div className="text-sm font-semibold">Total: ${Number(estimate.total).toFixed(2)}</div>
          <a
            className="inline-block mt-3 underline text-sm"
            href={`${import.meta.env.VITE_API_BASE_URL}/api/proposals/${estimate.id}.pdf`}
            target="_blank"
          >Open Proposal PDF</a>
        </div>
      )}
    </div>
  );
}
