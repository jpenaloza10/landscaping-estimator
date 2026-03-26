import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { authedFetch, ApiError, type Project } from "../lib/api";

type Estimate = {
  id: string | number;
  subtotal?: number;
  tax?: number;
  total?: number;
  created_at?: string;
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [projectData, estimatesData] = await Promise.all([
          authedFetch<Project>(`/api/projects/${id}`, { signal: ac.signal }),
          authedFetch<Estimate[] | { estimates: Estimate[] }>(
            `/api/projects/${id}/estimates`,
            { signal: ac.signal }
          ).catch(() => []),
        ]);

        setProject(projectData);

        const list = Array.isArray(estimatesData)
          ? estimatesData
          : (estimatesData as { estimates: Estimate[] }).estimates ?? [];
        setEstimates(list);
      } catch (e: unknown) {
        if ((e as { name?: string })?.name === "AbortError") return;
        if (e instanceof ApiError && e.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        if (e instanceof ApiError && e.status === 404) {
          setErr("Project not found.");
          return;
        }
        setErr(e instanceof Error ? e.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="h-4 w-64 bg-slate-200 rounded" />
        <div className="h-4 w-40 bg-slate-200 rounded" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700">
        <div className="font-medium">Error</div>
        <div className="text-sm mt-1">{err}</div>
        <Link to="/projects" className="mt-3 inline-block text-sm underline text-red-700">
          ← Back to projects
        </Link>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link to="/projects" className="text-xs text-slate-500 hover:underline">
            ← Projects
          </Link>
          <h1 className="text-xl font-bold text-green-700 mt-1">{project.name}</h1>
          {project.location && (
            <p className="text-sm text-slate-600">{project.location}</p>
          )}
          {project.description && (
            <p className="text-sm text-slate-500 mt-1">{project.description}</p>
          )}
        </div>
        <Link
          to={`/estimate?projectId=${project.id}`}
          className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          + New Estimate
        </Link>
      </div>

      {/* Estimates list */}
      <div>
        <h2 className="font-semibold mb-2">Estimates</h2>

        {estimates.length === 0 ? (
          <p className="text-sm text-slate-500">
            No estimates yet for this project.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-white overflow-hidden">
            {estimates.map((est) => (
              <li key={String(est.id)} className="p-3 flex items-center justify-between gap-3">
                <div className="text-sm">
                  <div className="font-medium">Estimate #{String(est.id).slice(-6)}</div>
                  {est.created_at && (
                    <div className="text-xs text-slate-500">
                      {new Date(est.created_at).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="text-sm text-right">
                  {est.total != null && (
                    <div className="font-semibold">${Number(est.total).toFixed(2)}</div>
                  )}
                  {est.tax != null && (
                    <div className="text-xs text-slate-500">
                      incl. ${Number(est.tax).toFixed(2)} tax
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="text-xs text-slate-400">
        Created: {new Date(project.created_at).toLocaleString()}
      </div>
    </div>
  );
}
