import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { authedFetch, deleteProject, ApiError, Project } from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";

type ProjectsResponse =
  | { projects: Project[] }
  | Project[];

export default function Projects() {
  const navigate = useNavigate();
  const { token, loading } = useAuth();
  const { t } = useTranslation();
  const [projects, setProjects]     = useState<Project[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [err, setErr]               = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete "${name}"?\n\nThis will permanently remove the project and all its estimates, expenses, and change orders.`)) return;
    setDeletingId(id);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  }

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
          <p className="font-serif text-2xl italic font-bold text-brand-cream mb-2">{t("projects.noProjectsYet")}</p>
          <p className="font-sans text-xs text-brand-cream-dim mb-6 tracking-wide">{t("projects.createFirst")}</p>
          <Link to="/projects/new" className="btn-brand-primary">
            {t("projects.newProject")}
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
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-brand-cream/10">
              <Link
                to={`/projects/${p.id}`}
                className="btn-brand-outline text-[10px] px-4 py-2"
              >
                {t("projects.openProject")}
              </Link>
              <button
                onClick={() => void handleDelete(p.id, p.name)}
                disabled={deletingId === p.id}
                className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream/25 hover:text-red-400 disabled:opacity-40 transition-colors"
                title="Delete project"
              >
                {deletingId === p.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }, [loading, loadingList, err, projects, t, deletingId, handleDelete]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="brand-eyebrow mb-1">{t("projects.eyebrow")}</p>
          <h1 className="font-serif text-4xl font-black italic text-brand-cream">{t("projects.title")}</h1>
        </div>
        <Link to="/projects/new" className="btn-brand-primary">
          {t("projects.newProject")}
        </Link>
      </div>
      {content}
    </div>
  );
}
