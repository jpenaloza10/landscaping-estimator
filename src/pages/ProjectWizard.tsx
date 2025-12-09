import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { createProject } from "../lib/api";

const SCOPE_OPTIONS = [
  "Paver Patio",
  "Artificial Turf",
  "Irrigation",
  "Fence",
  "Plantings",
  "Retaining Wall",
];

export default function ProjectWizard() {
  const { user } = useAuth();
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
    setScope((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  async function submit() {
    setErr(null);
    setLoading(true);

    try {
      // Must be logged in so api.ts can attach a valid Supabase JWT
      if (!user) {
        throw new Error("You must be logged in before creating a project.");
      }

      // Fold scope + notes into description for now
      const description = `Scope: ${scope.join(", ") || "None"}\nNotes: ${
        notes || "-"
      }`;

      // Use backend API helper (which attaches Supabase auth automatically)
      const project = await createProject({
        name,
        description,
        location,
      });

      // Navigate after successful creation
      // Either to list:
      nav("/projects");
    
    } catch (e: any) {
      console.error("Project create error:", e);
      setErr(e?.message ?? "Something went wrong while creating the project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold text-green-700">New Project</h1>

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
              step >= n ? "bg-green-600" : "bg-gray-300"
            }`}
          >
            {n}
          </div>
        ))}
        <div className="ml-2 text-gray-600">
          {step === 1 ? "Basics" : step === 2 ? "Scope" : "Location"}
        </div>
      </div>

      {step === 1 && (
        <div className="rounded-xl bg-white p-5 shadow">
          <label className="mb-2 block text-sm">Project Name</label>
          <input
            className="mb-4 w-full rounded border p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label className="mb-2 block text-sm">Notes (optional)</label>
          <textarea
            className="mb-4 min-h-[120px] w-full rounded border p-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              className="rounded bg-gray-200 px-4 py-2"
              onClick={() => setStep(2)}
              disabled={!name}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl bg-white p-5 shadow">
          <div className="mb-3 font-semibold">Select Scope Items</div>
          <div className="grid grid-cols-2 gap-2">
            {SCOPE_OPTIONS.map((opt) => (
              <label
                key={opt}
                className={`cursor-pointer rounded border p-2 ${
                  scope.includes(opt) ? "border-green-400 bg-green-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={scope.includes(opt)}
                  onChange={() => toggleScope(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <button
              className="rounded bg-gray-200 px-4 py-2"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              className="rounded bg-gray-200 px-4 py-2"
              onClick={() => setStep(3)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-xl bg-white p-5 shadow">
          <label className="mb-2 block text-sm">Location</label>
          <LocationAutocomplete value={location} onChange={setLocation} />
          {err && <div className="mb-3 text-sm text-red-600">{err}</div>}
          <div className="flex justify-between">
            <button
              className="rounded bg-gray-200 px-4 py-2"
              onClick={() => setStep(2)}
            >
              Back
            </button>
            <button
              disabled={loading || !location || !name}
              className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-60"
              onClick={submit}
            >
              {loading ? "Saving..." : "Create Project"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
