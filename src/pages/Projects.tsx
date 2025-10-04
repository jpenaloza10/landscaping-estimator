import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API = "http://localhost:8080";

type Project = {
  id: number;
  name: string;
  description: string;
  location: string;
  created_at: string;
};

export default function Projects() {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch projects");
        setProjects(data.projects);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-green-700">Your Projects</h1>
        <Link to="/projects/new" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          New Project
        </Link>
      </div>

      {loading && <div>Loading…</div>}
      {err && <div className="text-red-600">{err}</div>}

      {!loading && projects.length === 0 && (
        <div className="text-gray-500">No projects yet. Create your first one!</div>
      )}

      <ul className="grid gap-4">
        {projects.map(p => (
          <li key={p.id} className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-gray-600">{p.location}</div>
            <div className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</div>
            <div className="text-xs text-gray-400 mt-2">Created: {new Date(p.created_at).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

