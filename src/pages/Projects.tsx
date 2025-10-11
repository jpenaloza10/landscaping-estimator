// src/pages/Projects.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { authedFetch, ApiError, Project } from "../lib/api";

type ProjectsResponse =
  | { projects: Project[] }  // your backend returns this shape
  | Project[];               // tolerate raw arrays too

export default function Projects() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const data = await authedFetch<ProjectsResponse>("/api/projects", {
          signal: ac.signal,
        });
        const list = Array.isArray(data) ? data : data.projects;
        setProjects(Array.isArray(list) ? list : []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        if (e instanceof ApiError && e.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setErr(e?.message ?? "Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [token, navigate]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <ul className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="h-4 w-48 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-64 bg-slate-200 rounded mb-1" />
              <div className="h-3 w-40 bg-slate-200 rounded" />
            </li>
          ))}
        </ul>
      );
    }

    if (err) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3">
          <div className="font-medium">Couldn’t load projects</div>
          <div className="text-sm">{err}</div>
        </div>
      );
    }

    if (!projects.length) {
      return (
        <div className="text-gray-600 bg-white rounded-lg shadow p-6">
          <div className="font-medium">No projects yet</div>
          <p className="text-sm mt-1">Create your first project to get started.</p>
          <Link
            to="/projects/new"
            className="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            New Project
          </Link>
        </div>
      );
    }

    return (
      <ul className="grid gap-4">
        {projects.map((p) => (
          <li key={p.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-green-800">{p.name}</div>
                {p.location && <div className="text-sm text-gray-600">{p.location}</div>}
                {p.description && (
                  <div className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  Created: {new Date(p.created_at).toLocaleString()}
                </div>
              </div>
              <Link
                to={`/projects/${p.id}`}
                className="shrink-0 text-green-700 hover:underline mt-1"
              >
                Open →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    );
  }, [loading, err, projects]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-green-700">Your Projects</h1>
        <Link
          to="/projects/new"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          New Project
        </Link>
      </div>
      {content}
    </div>
  );
}
