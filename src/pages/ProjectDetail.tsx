import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { authedFetch, ApiError, type Project } from "../lib/api";

type Estimate = {
  id: string | number;
  subtotal?: number;
  tax?: number;
  total?: number;
  createdAt?: string;   // Prisma camelCase
  created_at?: string;  // fallback alias
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
      <div className="space-y-4 animate-pulse">
        <div className="h-5 w-32 bg-brand-cream/10 rounded" />
        <div className="h-8 w-64 bg-brand-cream/10 rounded" />
        <div className="h-4 w-48 bg-brand-cream/10 rounded" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="brand-card border-brand-orange/40">
        <p className="brand-eyebrow mb-1">Error</p>
        <p className="font-sans text-sm text-brand-cream-dim mt-1">{err}</p>
        <Link to="/projects" className="font-sans text-xs text-brand-cream-dim underline underline-offset-2 mt-3 inline-block hover:text-brand-orange">
          ← Back to projects
        </Link>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/projects" className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream-dim hover:text-brand-orange transition-colors">
          ← Projects
        </Link>
        <div className="flex items-start justify-between gap-4 mt-3">
          <div>
            <p className="brand-eyebrow mb-1">Project</p>
            <h1 className="font-serif text-4xl font-black italic text-brand-cream">{project.name}</h1>
            {project.location && (
              <p className="font-sans text-sm text-brand-cream-dim mt-1">{project.location}</p>
            )}
            {project.description && (
              <p className="font-sans text-xs text-brand-cream-dim/70 mt-2 leading-relaxed max-w-lg">{project.description}</p>
            )}
          </div>
          <Link to={`/estimate?projectId=${project.id}`} className="btn-brand-primary shrink-0">
            + New Estimate
          </Link>
        </div>
      </div>

      {/* Estimates */}
      <div className="brand-card">
        <p className="brand-eyebrow mb-4">Estimates</p>

        {estimates.length === 0 ? (
          <p className="font-sans text-xs text-brand-cream-dim">No estimates yet for this project.</p>
        ) : (
          <ul className="divide-y divide-brand-cream/10">
            {estimates.map((est) => (
              <li key={String(est.id)} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-serif text-sm font-bold italic text-brand-cream">
                    Estimate #{String(est.id).slice(-6)}
                  </p>
                  {(est.createdAt ?? est.created_at) && (
                    <p className="font-sans text-[10px] text-brand-cream-dim mt-0.5 tracking-wide">
                      {new Date((est.createdAt ?? est.created_at)!).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {est.total != null && (
                    <p className="font-serif text-lg font-black italic text-brand-orange-light">
                      ${Number(est.total).toFixed(2)}
                    </p>
                  )}
                  {est.tax != null && (
                    <p className="font-sans text-[10px] text-brand-cream-dim">
                      incl. ${Number(est.tax).toFixed(2)} tax
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="font-sans text-[10px] tracking-widest uppercase text-brand-cream-dim/40">
        Created {new Date(project.created_at).toLocaleString()}
      </p>
    </div>
  );
}
