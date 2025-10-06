import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getProjects, type Project } from "../lib/api"; 

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // getProjects() already attaches token via api() -> localStorage
        const list = await getProjects();
        setProjects(list);
      } catch (e: any) {
        setErr(e.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-700">Dashboard</h1>
          <p className="text-gray-600">Welcome, {user?.name}</p>
        </div>
        <Link
          to="/projects/new"  
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          New Project
        </Link>
      </div>

      {loading && <div>Loading projects…</div>}
      {err && <div className="text-red-600">{err}</div>}
      {!loading && projects.length === 0 && (
        <div className="text-gray-500">No projects yet — create your first one.</div>
      )}

      <ul className="grid md:grid-cols-2 gap-4">
        {projects.map((p) => (
          <li key={p.id} className="bg-white rounded-xl shadow p-4">
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-gray-600">{p.location}</div>
            <div className="text-sm text-gray-500 mt-1 whitespace-pre-line line-clamp-3">
              {p.description}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Created: {new Date(p.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
