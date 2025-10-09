import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LocationAutocomplete from "../components/LocationAutocomplete";


const API = "http://localhost:8080";

const SCOPE_OPTIONS = [
  "Paver Patio",
  "Artificial Turf",
  "Irrigation",
  "Fence",
  "Plantings",
  "Retaining Wall"
];

export default function ProjectWizard() {
  const { token } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  // Step 2
  const [scope, setScope] = useState<string[]>([]);

  // Step 3
  const [location, setLocation] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleScope(item: string) {
    setScope(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  }

  async function submit() {
    setErr(null); setLoading(true);
    try {
      // Fold scope + notes into description for now
      const description = `Scope: ${scope.join(", ") || "None"}\nNotes: ${notes || "-"}`;
      const res = await fetch(`${API}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description, location })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");
      nav("/projects");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-green-700 mb-4">New Project</h1>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {[1,2,3].map(n => (
          <div key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${step>=n ? "bg-green-600" : "bg-gray-300"}`}>{n}</div>
        ))}
        <div className="text-gray-600 ml-2">
          {step===1?"Basics":step===2?"Scope":"Location"}
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white shadow rounded-xl p-5">
          <label className="block mb-2 text-sm">Project Name</label>
          <input className="w-full border rounded p-2 mb-4" value={name} onChange={e=>setName(e.target.value)} required />
          <label className="block mb-2 text-sm">Notes (optional)</label>
          <textarea className="w-full border rounded p-2 mb-4 min-h-[120px]" value={notes} onChange={e=>setNotes(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 rounded bg-gray-200" onClick={()=>setStep(2)} disabled={!name}>Next</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white shadow rounded-xl p-5">
          <div className="mb-3 font-semibold">Select Scope Items</div>
          <div className="grid grid-cols-2 gap-2">
            {SCOPE_OPTIONS.map(opt => (
              <label key={opt} className={`border rounded p-2 cursor-pointer ${scope.includes(opt) ? "bg-green-50 border-green-400" : ""}`}>
                <input type="checkbox" className="mr-2" checked={scope.includes(opt)} onChange={()=>toggleScope(opt)} />
                {opt}
              </label>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <button className="px-4 py-2 rounded bg-gray-200" onClick={()=>setStep(1)}>Back</button>
            <button className="px-4 py-2 rounded bg-gray-200" onClick={()=>setStep(3)}>Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white shadow rounded-xl p-5">
          <label className="block mb-2 text-sm">Location</label>
          <LocationAutocomplete value={location} onChange={setLocation} />
          {err && <div className="text-red-600 text-sm mb-3">{err}</div>}
          <div className="flex justify-between">
            <button className="px-4 py-2 rounded bg-gray-200" onClick={()=>setStep(2)}>Back</button>
            <button disabled={loading || !location || !name} className="px-4 py-2 rounded bg-green-600 text-white"
                    onClick={submit}>
              {loading ? "Saving..." : "Create Project"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
