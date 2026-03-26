import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { authedFetch, ApiError, Project } from "../lib/api";

type ProjectsResponse =
  | { projects: Project[] } 
  | Project[];              

export default function Projects() {
  const navigate = useNavigate();
  const { token, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;          // wait for auth
    if (!token) {                 // unauth → login
      navigate("/", { replace: true });
      return;
    }

    const ac = new AbortController();
    setLoadingList(true);
    setErr(null);

    (async () => {
      try {
        const data = await authedFetch<ProjectsResponse>("/api/projects", {
          signal: ac.signal,
        });
        const list = Array.isArray(data) ? data : data.projects;
        setProjects(Array.isArray(list) ? list : []);
      } catch (e: unknown) {
        if ((e as { name?: string })?.name === "AbortError") return;
        if (e instanceof ApiError && e.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        setErr(e instanceof Error ? e.message : "Failed to fetch projects");
      } finally {
        setLoadingList(false);
      }
    })();

    return () => ac.abort();
  }, [token, loading, navigate]);

  const content = useMemo(() => {
    if (loading || loadingList) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="brand-card animate-pulse space-y-3">
              <div className="h-4 w-40 bg-brand-cream/10 rounded" />
              <div className="h-3 w-56 bg-brand-cream/10 rounded" />
              <div className="h-3 w-32 bg-brand-cream/10 rounded" />
            </div>
          ))}
        </div>
      );
    }

    if (err) {
      return (
        <div className="brand-card border-brand-orange/40 mt-6">
          <p className="font-sans text-xs font-semibold tracking-widest uppercase text-brand-orange mb-1">Error</p>
          <p className="font-sans text-sm text-brand-cream-dim">{err}</p>
        </div>
      );
    }

    if (!projects.length) {
      return (
        <div className="brand-card text-center py-12 mt-6">
          <p className="font-serif text-2xl italic font-bold text-brand-cream mb-2">No projects yet</p>
          <p className="font-sans text-xs text-brand-cream-dim mb-6 tracking-wide">Create your first project to get started.</p>
          <Link to="/projects/new" className="btn-brand-primary">
            New Project
          </Link>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        {projects.map((p) => (
          <div key={p.id} className="brand-card flex flex-col justify-between gap-4">
            <div>
              <p className="font-serif text-lg font-bold italic text-brand-cream">{p.name}</p>
              {p.location && (
                <p className="font-sans text-[11px] text-brand-cream-dim mt-1 tracking-wide">{p.location}</p>
              )}
              {p.description && (
                <p className="font-sans text-xs text-brand-cream-dim/70 mt-2 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              )}
              <p className="font-sans text-[10px] text-brand-cream-dim/40 mt-3 tracking-widest uppercase">
                {new Date(p.created_at).toLocaleDateString()}
              </p>
            </div>
            <Link
              to={`/projects/${p.id}`}
              className="btn-brand-outline self-start text-[10px] px-4 py-2"
            >
              Open →
            </Link>
          </div>
        ))}
      </div>
    );
  }, [loading, loadingList, err, projects]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="brand-eyebrow mb-1">Your work</p>
          <h1 className="font-serif text-4xl font-black italic text-brand-cream">Projects</h1>
        </div>
        <Link to="/projects/new" className="btn-brand-primary">
          + New Project
        </Link>
      </div>
      {content}
    </div>
  );
}
