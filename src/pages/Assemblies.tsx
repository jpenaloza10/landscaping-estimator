import { useEffect, useState } from "react";
import { listAssemblies, listTemplates } from "../lib/api";

// Local type definitions since ../lib/api does not export these
export type Assembly = {
  id: string | number;
  name: string;
  unit?: string | null;
  items?: unknown[]; // only used for .length in this file
  wastePct?: number | null;
};

export type Template = {
  id: string | number;
  name: string;
  lines?: unknown[]; // only used for .length in this file
};

export default function Assemblies() {
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      listAssemblies() as Promise<Assembly[]>,
      listTemplates() as Promise<Template[]>,
    ])
      .then(([assembliesData, templatesData]) => {
        setAssemblies(assembliesData ?? []);
        setTemplates(templatesData ?? []);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load assemblies or templates. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-sm text-slate-600">
        Loading assemblies...
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="grid gap-6">
      {/* Assemblies Section */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Assemblies</h2>
          {/* Future Add Button */}
          <button className="rounded bg-slate-900 px-3 py-1 text-sm text-white">
            + Add
          </button>
        </div>

        {assemblies.length === 0 ? (
          <p className="text-sm text-slate-500">No assemblies found.</p>
        ) : (
          <ul className="text-sm">
            {assemblies.map((a) => (
              <li key={a.id} className="border-b py-2 last:border-0">
                <div className="font-medium">
                  {a.name}{" "}
                  <span className="text-xs text-slate-500">
                    ({a.unit || "unit"})
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {(a.items?.length || 0)} items • waste{" "}
                  {Math.round((a.wastePct || 0) * 100)}%
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Templates Section */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Templates</h2>
        </div>

        {templates.length === 0 ? (
          <p className="text-sm text-slate-500">No templates found.</p>
        ) : (
          <ul className="text-sm">
            {templates.map((t) => (
              <li key={t.id} className="border-b py-2 last:border-0">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-slate-500">
                  {(t.lines?.length || 0)} lines
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
