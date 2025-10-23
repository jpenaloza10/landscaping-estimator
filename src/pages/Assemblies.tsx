import { useEffect, useState } from "react";
import { listAssemblies, listTemplates } from "../lib/api";

export default function Assemblies() {
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    listAssemblies().then(setAssemblies).catch(console.error);
    listTemplates().then(setTemplates).catch(console.error);
  }, []);

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Assemblies</h2>
        <ul className="text-sm">
          {assemblies.map(a => (
            <li key={a.id} className="py-2 border-b last:border-0">
              <div className="font-medium">{a.name} <span className="text-xs text-slate-500">({a.unit})</span></div>
              <div className="text-xs text-slate-500">{a.items.length} items • waste {Math.round(a.wastePct*100)}%</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Templates</h2>
        <ul className="text-sm">
          {templates.map(t => (
            <li key={t.id} className="py-2 border-b last:border-0">
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-slate-500">{t.lines.length} lines</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
