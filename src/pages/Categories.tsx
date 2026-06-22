import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAssemblies, listTemplates } from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";

// ── Types ────────────────────────────────────────────────────────────────────
type Assembly = {
  id: string | number;
  name: string;
  trade?: string | null;
  unit?: string | null;
  items?: unknown[];
  wastePct?: number | null;
};

type Template = {
  id: string | number;
  name: string;
  lines?: unknown[];
};

// ── Category display meta ─────────────────────────────────────────────────────
const TRADE_META: Record<string, { label: string; labelEs: string; color: string }> = {
  DEMO:       { label: "Demo / Site Prep",               labelEs: "Demo / Prep del sitio",            color: "text-orange-300 border-orange-400/30 bg-orange-400/10"   },
  SOIL_PREP:  { label: "Soil Preparation",               labelEs: "Preparación del suelo",            color: "text-yellow-300 border-yellow-400/30 bg-yellow-400/10"   },
  IRRIGATION: { label: "Irrigation",                    labelEs: "Irrigación",                       color: "text-blue-300 border-blue-400/30 bg-blue-400/10"         },
  HARDSCAPE:  { label: "Hardscape",                     labelEs: "Paisaje duro",                     color: "text-stone-300 border-stone-400/30 bg-stone-400/10"      },
  CONCRETE:   { label: "Concrete",                      labelEs: "Concreto",                         color: "text-slate-300 border-slate-400/30 bg-slate-400/10"      },
  PLANTING:   { label: "Planting / Sod",                labelEs: "Siembra / Césped",                 color: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
  MULCH_ROCK: { label: "Mulch / Rock",                  labelEs: "Mantillo / Roca",                  color: "text-amber-300 border-amber-400/30 bg-amber-400/10"      },
  LIGHTING:   { label: "Landscape Lighting (Low Volt)", labelEs: "Iluminación de paisaje",           color: "text-purple-300 border-purple-400/30 bg-purple-400/10"   },
  CLEANUP:    { label: "Cleanup",                       labelEs: "Limpieza final",                   color: "text-teal-300 border-teal-400/30 bg-teal-400/10"         },
  LABOR:      { label: "General Labor",                 labelEs: "Mano de obra general",             color: "text-red-300 border-red-400/30 bg-red-400/10"            },
  Hardscape:  { label: "Hardscape",                    labelEs: "Paisaje duro",                     color: "text-stone-300 border-stone-400/30 bg-stone-400/10"      },
  Irrigation: { label: "Irrigation",                   labelEs: "Irrigación",                       color: "text-blue-300 border-blue-400/30 bg-blue-400/10"         },
  Planting:   { label: "Planting / Sod",               labelEs: "Siembra / Césped",                 color: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
};

function tradeMeta(trade?: string | null) {
  if (!trade) return null;
  return TRADE_META[trade] ?? { label: trade, labelEs: trade, color: "text-brand-cream-dim border-brand-cream/20 bg-brand-cream/5" };
}

export default function Categories() {
  const { t, lang } = useTranslation();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [templates,  setTemplates]  = useState<Template[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      listAssemblies() as Promise<Assembly[]>,
      listTemplates()  as Promise<Template[]>,
    ])
      .then(([a, t]) => {
        setAssemblies(a ?? []);
        setTemplates(t ?? []);
      })
      .catch((e) => {
        console.error(e);
        setError(lang === "es" ? "Error al cargar categorías." : "Failed to load categories.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Group assemblies by trade
  const grouped = assemblies.reduce<Record<string, Assembly[]>>((acc, a) => {
    const key = a.trade ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  // ── States ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="brand-card h-24 bg-brand-cream/5" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="brand-card border-brand-orange/30 bg-brand-orange/5">
        <p className="font-sans text-sm text-brand-orange">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="brand-eyebrow mb-1">
            {lang === "es" ? "Biblioteca" : "Library"}
          </p>
          <h1 className="font-serif text-4xl font-black italic text-brand-cream">
            {lang === "es" ? "Categorías" : "Categories"}
          </h1>
          <p className="font-sans text-xs text-brand-cream-dim mt-2 max-w-lg leading-relaxed">
            {lang === "es"
              ? "Todas las categorías de trabajo disponibles para tus estimaciones. Ajusta los precios unitarios en la hoja de precios."
              : "All work categories available in your estimates. Adjust unit prices in your Price Sheet."}
          </p>
        </div>
        <Link to="/pricing" className="btn-brand-outline shrink-0">
          {lang === "es" ? "Hoja de precios →" : "Price Sheet →"}
        </Link>
      </div>

      {/* Category chips overview */}
      <div className="brand-card">
        <p className="brand-eyebrow mb-3">{lang === "es" ? "Todas las categorías" : "All Categories"}</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(grouped).map((trade) => {
            const meta = tradeMeta(trade);
            return (
              <span
                key={trade}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 border font-sans text-[9px] font-semibold tracking-[0.22em] uppercase rounded-sm ${meta?.color ?? "text-brand-cream-dim border-brand-cream/20 bg-brand-cream/5"}`}
              >
                {lang === "es" ? (meta?.labelEs ?? trade) : (meta?.label ?? trade)}
                <span className="opacity-60">({grouped[trade].length})</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Assemblies by category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="brand-card text-center py-12">
          <p className="font-sans text-xs text-brand-cream-dim tracking-widest uppercase">
            {lang === "es" ? "No hay categorías todavía." : "No categories yet."}
          </p>
          <p className="font-sans text-xs text-brand-cream-dim mt-2 max-w-xs mx-auto">
            {lang === "es"
              ? "Las categorías de estimación aparecerán aquí cuando se agreguen al sistema."
              : "Estimate categories will appear here once added to the system."}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([trade, rows]) => {
          const meta = tradeMeta(trade);
          const catLabel = lang === "es" ? (meta?.labelEs ?? trade) : (meta?.label ?? trade);

          return (
            <div key={trade} className="brand-card">
              {/* Category header */}
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-2.5 py-1 border font-sans text-[9px] font-semibold tracking-[0.22em] uppercase rounded-sm ${meta?.color ?? "text-brand-cream-dim border-brand-cream/20 bg-brand-cream/5"}`}>
                  {catLabel}
                </span>
                <span className="font-sans text-[10px] tracking-widest uppercase text-brand-cream-dim">
                  {rows.length} {lang === "es" ? "ensamblajes" : "assemblies"}
                </span>
              </div>

              {/* Assembly list */}
              <div className="divide-y divide-brand-cream/10">
                {rows.map((a) => (
                  <div key={a.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-sans text-sm font-semibold text-brand-cream">{a.name}</p>
                        <p className="font-sans text-[11px] text-brand-cream-dim mt-0.5">
                          {lang === "es" ? "Unidad" : "Unit"}: <span className="text-brand-cream">{a.unit || "—"}</span>
                          {a.wastePct != null && a.wastePct > 0 && (
                            <span className="ml-3 text-brand-cream-dim">
                              {lang === "es" ? "Desperdicio" : "Waste"}: {Math.round(a.wastePct * 100)}%
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-sans text-[10px] tracking-widest uppercase text-brand-cream-dim">
                          {(a.items?.length || 0)} {lang === "es" ? "artículos" : "items"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Templates section */}
      {templates.length > 0 && (
        <div className="brand-card">
          <div className="flex items-center justify-between mb-4">
            <p className="brand-eyebrow">{lang === "es" ? "Plantillas" : "Templates"}</p>
            <span className="font-sans text-[10px] tracking-widest uppercase text-brand-cream-dim">
              {templates.length} {lang === "es" ? "plantillas" : "templates"}
            </span>
          </div>
          <div className="divide-y divide-brand-cream/10">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <p className="font-sans text-sm text-brand-cream">{tmpl.name}</p>
                <p className="font-sans text-[11px] text-brand-cream-dim">
                  {(tmpl.lines?.length || 0)} {lang === "es" ? "líneas" : "lines"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
