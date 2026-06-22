import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createEstimate,
  listAssemblies,
  getProjects,
  getProposalPdfUrl,
} from "../lib/api";
import DownloadPdfButton from "../components/DownloadPdfButton";
import AiAssistantPanel from "../components/AiAssistantPanel";
import { useTranslation } from "../i18n/LanguageContext";

export type Project = { id: number; name: string };

export type Assembly = {
  id: string | number;
  name: string;
  unit?: string | null;
  items?: unknown[];
  wastePct?: number | null;
};

export type EstimateItem = {
  name: string; qty: number; unit: string; unitCost: number; extended: number;
};

export type EstimateLine = {
  id?: string | number;
  assemblyId: string | number;
  items?: EstimateItem[];
  lineTotal?: number;
};

export type Estimate = {
  id: string | number;
  subtotal?: number; tax?: number; total?: number;
  lines?: EstimateLine[];
};

type PhaseEntry = {
  phaseId: number;
  assemblyId: string;
  area: number;
  skipped: boolean;
};

const labelClass = "block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-2";
const selectClass = "w-full bg-transparent border border-brand-cream/30 rounded-sm px-3 py-2 text-brand-cream text-sm font-sans focus:outline-none focus:border-brand-cream/70 transition-colors";

export default function EstimateWizard() {
  const { t } = useTranslation();

  // ── 8-Phase guided mode ──────────────────────────────────────────────────────
  const PHASES = [
    { id: 1, name: t("estimateWizard.phases.demo"),       hint: t("estimateWizard.phases.demoHint")       },
    { id: 2, name: t("estimateWizard.phases.soil"),       hint: t("estimateWizard.phases.soilHint")       },
    { id: 3, name: t("estimateWizard.phases.irrigation"), hint: t("estimateWizard.phases.irrigationHint") },
    { id: 4, name: t("estimateWizard.phases.hardscape"),  hint: t("estimateWizard.phases.hardscapeHint")  },
    { id: 5, name: t("estimateWizard.phases.planting"),   hint: t("estimateWizard.phases.plantingHint")   },
    { id: 6, name: t("estimateWizard.phases.mulch"),      hint: t("estimateWizard.phases.mulchHint")      },
    { id: 7, name: t("estimateWizard.phases.lighting"),   hint: t("estimateWizard.phases.lightingHint")   },
    { id: 8, name: t("estimateWizard.phases.cleanup"),    hint: t("estimateWizard.phases.cleanupHint")    },
  ];

  const [assemblies, setAssemblies]     = useState<Assembly[]>([]);
  const [projects,   setProjects]       = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [loading,    setLoading]        = useState(false);
  const [error,      setError]          = useState("");
  const [estimate,   setEstimate]       = useState<Estimate | null>(null);

  // Mode: "quick" (single assembly) or "guided" (8 phases)
  const [mode, setMode] = useState<"quick" | "guided">("quick");

  // ── Quick mode state ──
  const [assemblyId, setAssemblyId] = useState<string>("");
  const [quickTitle, setQuickTitle] = useState("");
  const [area,       setArea]       = useState<number>(0);
  const [zip,        setZip]        = useState("");
  const [state,      setState]      = useState("");

  // ── Guided mode state ──
  const [guidedTitle,   setGuidedTitle]   = useState("");
  const [guidedZip,     setGuidedZip]     = useState("");
  const [guidedState,   setGuidedState]   = useState("");
  const [currentPhase,  setCurrentPhase]  = useState(0); // index into PHASES
  const [phaseEntries,  setPhaseEntries]  = useState<PhaseEntry[]>(
    PHASES.map((p) => ({ phaseId: p.id, assemblyId: "", area: 0, skipped: false }))
  );

  useEffect(() => {
    (async () => {
      try {
        const [assembliesData, projectsData] = await Promise.all([
          listAssemblies() as Promise<Assembly[]>,
          getProjects()    as Promise<Project[]>,
        ]);
        setAssemblies(assembliesData ?? []);
        if (assembliesData?.length) setAssemblyId(String(assembliesData[0].id));
        setProjects(projectsData ?? []);
        if (projectsData?.length) setActiveProjectId(projectsData[0].id);
        // Pre-fill first assembly for each guided phase
        if (assembliesData?.length) {
          const firstId = String(assembliesData[0].id);
          setPhaseEntries((prev) => prev.map((p) => ({ ...p, assemblyId: firstId })));
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      }
    })();
  }, []);

  const assemblyNameById = useMemo(
    () => new Map(assemblies.map((a) => [String(a.id), a.name])),
    [assemblies]
  );
  const selectedAssembly = useMemo(
    () => assemblies.find((a) => String(a.id) === String(assemblyId)) ?? null,
    [assemblies, assemblyId]
  );

  const ZIP_RE   = /^\d{5}(-\d{4})?$/;
  const STATE_RE = /^[A-Z]{2}$/;

  // ── Quick mode submit ──
  const canCreate =
    !loading &&
    !!assemblyId &&
    activeProjectId != null &&
    area > 0 &&
    STATE_RE.test(state.trim()) &&
    ZIP_RE.test(zip.trim());

  async function handleCreate() {
    if (!canCreate || activeProjectId == null) return;
    setLoading(true); setError(""); setEstimate(null);
    try {
      const est = (await createEstimate({
        projectId: activeProjectId,
        title: quickTitle.trim() || undefined,
        location: { zip, state },
        lines: [{ assemblyId, inputs: { area } }],
      })) as Estimate;
      if (!est?.id) throw new Error("Estimate created but no id returned.");
      setEstimate(est);
    } catch (e: unknown) {
      const apiErr = e as { payload?: { error?: string }; message?: string };
      setError(apiErr?.payload?.error ?? (e instanceof Error ? e.message : "Failed to create estimate"));
    } finally {
      setLoading(false);
    }
  }

  // ── Guided mode phase helpers ──
  function updatePhase(idx: number, patch: Partial<PhaseEntry>) {
    setPhaseEntries((prev) => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));
  }

  const guidedCanFinish =
    !loading &&
    activeProjectId != null &&
    STATE_RE.test(guidedState.trim()) &&
    ZIP_RE.test(guidedZip.trim()) &&
    phaseEntries.some((p) => !p.skipped && p.area > 0 && p.assemblyId);

  async function handleGuidedCreate() {
    if (!guidedCanFinish || activeProjectId == null) return;
    setLoading(true); setError(""); setEstimate(null);
    const lines = phaseEntries
      .filter((p) => !p.skipped && p.area > 0 && p.assemblyId)
      .map((p) => ({ assemblyId: p.assemblyId, inputs: { area: p.area } }));

    try {
      const est = (await createEstimate({
        projectId: activeProjectId,
        title: guidedTitle.trim() || undefined,
        location: { zip: guidedZip, state: guidedState },
        lines,
      })) as Estimate;
      if (!est?.id) throw new Error("Estimate created but no id returned.");
      setEstimate(est);
    } catch (e: unknown) {
      const apiErr = e as { payload?: { error?: string }; message?: string };
      setError(apiErr?.payload?.error ?? (e instanceof Error ? e.message : "Failed to create estimate"));
    } finally {
      setLoading(false);
    }
  }

  const isLastPhase = currentPhase === PHASES.length - 1;

  return (
    <div className="space-y-6">
      <div className="brand-card">
        <p className="brand-eyebrow mb-1">{t("estimateWizard.eyebrow")}</p>
        <h2 className="font-serif text-3xl font-black italic text-brand-cream mb-6">{t("estimateWizard.title")}</h2>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6 border border-brand-cream/15 p-1 w-fit">
          {(["quick", "guided"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 font-sans text-[10px] font-semibold tracking-[0.18em] uppercase transition-colors ${
                mode === m
                  ? "bg-brand-orange text-white"
                  : "text-brand-cream-dim hover:text-brand-cream"
              }`}
            >
              {m === "quick" ? t("estimateWizard.quickMode") : t("estimateWizard.guidedMode")}
            </button>
          ))}
        </div>

        {/* ── Shared fields: Project + Location ── */}
        <div className="mb-5">
          <label className={labelClass}>{t("common.project")}</label>
          <select
            className={selectClass}
            value={activeProjectId ?? ""}
            onChange={(e) => setActiveProjectId(e.target.value ? Number(e.target.value) : null)}
          >
            {projects.length === 0 && <option value="">{t("estimateWizard.noProjects")}</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {projects.length === 0 && (
            <p className="font-sans text-[11px] text-brand-orange mt-2">
              {t("estimateWizard.noProjectsNote")} <Link to="/projects/new" className="underline underline-offset-2">{t("estimateWizard.createOneFirst")}</Link>.
            </p>
          )}
        </div>

        {/* ══════════════════ QUICK MODE ══════════════════ */}
        {mode === "quick" && (
          <>
            <div className="mb-5">
              <label className={labelClass}>{t("estimateWizard.estimateTitleLabel")} <span className="normal-case font-normal opacity-50">{t("estimateWizard.optional")}</span></label>
              <input className="brand-input" placeholder={t("estimateWizard.titlePlaceholder")} value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} maxLength={120} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t("estimateWizard.category")}</label>
                <select className={selectClass} value={assemblyId} onChange={(e) => setAssemblyId(e.target.value)}>
                  {assemblies.length === 0 && (
                    <option value="">{t("estimateWizard.noCategories")}</option>
                  )}
                  {assemblies.map((a) => (
                    <option key={a.id} value={String(a.id)}>{a.name}</option>
                  ))}
                </select>
                {selectedAssembly && (
                  <p className="font-sans text-[10px] text-brand-cream-dim/60 mt-1.5 tracking-wide">
                    {selectedAssembly.items?.length ?? 0} items
                    {typeof selectedAssembly.wastePct === "number" ? ` · ${Math.round((selectedAssembly.wastePct || 0) * 100)}% waste` : ""}
                    {selectedAssembly.unit ? ` · ${selectedAssembly.unit}` : ""}
                  </p>
                )}
                {assemblies.length === 0 && (
                  <p className="font-sans text-[10px] text-brand-orange mt-1.5">
                    {t("estimateWizard.noCategoriesNote")}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t("estimateWizard.area")}</label>
                <input className="brand-input" type="number" min={1} placeholder={t("estimateWizard.areaPlaceholder")} value={area === 0 ? "" : area} onChange={(e) => setArea(Math.max(0, Number(e.target.value)))} />
              </div>
              <div>
                <label className={labelClass}>{t("estimateWizard.state")}</label>
                <input className="brand-input" value={state} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder={t("estimateWizard.statePlaceholder")} maxLength={2} />
              </div>
              <div>
                <label className={labelClass}>{t("estimateWizard.zip")}</label>
                <input className="brand-input" value={zip} onChange={(e) => setZip(e.target.value)} placeholder={t("estimateWizard.zipPlaceholder")} maxLength={10} />
              </div>
            </div>

            <button onClick={handleCreate} disabled={!canCreate} className="btn-brand-primary mt-6 disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? t("estimateWizard.creating") : t("estimateWizard.createEstimate")}
            </button>
          </>
        )}

        {/* ══════════════════ GUIDED MODE ══════════════════ */}
        {mode === "guided" && (
          <>
            {/* Header info */}
            <div className="mb-5">
              <label className={labelClass}>{t("estimateWizard.estimateTitleLabel")} <span className="normal-case font-normal opacity-50">{t("estimateWizard.optional")}</span></label>
              <input className="brand-input" placeholder={t("estimateWizard.guidedTitlePlaceholder")} value={guidedTitle} onChange={(e) => setGuidedTitle(e.target.value)} maxLength={120} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              <div>
                <label className={labelClass}>{t("estimateWizard.state")}</label>
                <input className="brand-input" value={guidedState} onChange={(e) => setGuidedState(e.target.value.toUpperCase())} placeholder={t("estimateWizard.statePlaceholder")} maxLength={2} />
              </div>
              <div>
                <label className={labelClass}>{t("estimateWizard.zip")}</label>
                <input className="brand-input" value={guidedZip} onChange={(e) => setGuidedZip(e.target.value)} placeholder={t("estimateWizard.zipPlaceholder")} maxLength={10} />
              </div>
            </div>

            {/* Phase stepper */}
            <div className="mb-4">
              {/* Progress dots */}
              <div className="flex items-center gap-1.5 mb-5 flex-wrap">
                {PHASES.map((ph, i) => {
                  const entry = phaseEntries[i];
                  const done  = entry.skipped || (entry.area > 0 && entry.assemblyId);
                  return (
                    <button
                      key={ph.id}
                      onClick={() => setCurrentPhase(i)}
                      className={`w-7 h-7 flex items-center justify-center font-sans text-[10px] font-bold border transition-colors ${
                        i === currentPhase
                          ? "bg-brand-orange text-white border-brand-orange"
                          : done
                          ? "border-emerald-400/50 text-emerald-400"
                          : "border-brand-cream/20 text-brand-cream-dim"
                      }`}
                    >
                      {ph.id}
                    </button>
                  );
                })}
              </div>

              {/* Current phase form */}
              {(() => {
                const ph    = PHASES[currentPhase];
                const entry = phaseEntries[currentPhase];
                return (
                  <div className="border border-brand-cream/15 p-4 bg-brand-cream/5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <p className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-orange mb-0.5">
                          {t("estimateWizard.phase", { num: String(ph.id), total: String(PHASES.length) })}
                        </p>
                        <p className="font-serif text-lg font-bold italic text-brand-cream">{ph.name}</p>
                        <p className="font-sans text-[11px] text-brand-cream-dim">{ph.hint}</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={entry.skipped}
                          onChange={(e) => updatePhase(currentPhase, { skipped: e.target.checked })}
                          className="accent-brand-orange w-4 h-4"
                        />
                        <span className="font-sans text-[10px] tracking-wide text-brand-cream-dim">{t("estimateWizard.skip")}</span>
                      </label>
                    </div>

                    {!entry.skipped && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>{t("estimateWizard.category")}</label>
                          <select
                            className={selectClass}
                            value={entry.assemblyId}
                            onChange={(e) => updatePhase(currentPhase, { assemblyId: e.target.value })}
                          >
                            {assemblies.length === 0 && (
                              <option value="">{t("estimateWizard.noCategories")}</option>
                            )}
                            {assemblies.map((a) => (
                              <option key={a.id} value={String(a.id)}>{a.name}</option>
                            ))}
                          </select>
                          {assemblies.length === 0 && (
                            <p className="font-sans text-[10px] text-brand-orange mt-1">
                              {t("estimateWizard.noCategoriesNote")}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className={labelClass}>{t("estimateWizard.area")}</label>
                          <input
                            className="brand-input"
                            type="number"
                            min={1}
                            placeholder={t("estimateWizard.areaPlaceholder")}
                            value={entry.area === 0 ? "" : entry.area}
                            onChange={(e) => updatePhase(currentPhase, { area: Math.max(0, Number(e.target.value)) })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Phase nav */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setCurrentPhase((p) => Math.max(0, p - 1))}
                  disabled={currentPhase === 0}
                  className="btn-brand-outline disabled:opacity-30"
                >
                  {t("common.back")}
                </button>
                {isLastPhase ? (
                  <button
                    onClick={handleGuidedCreate}
                    disabled={!guidedCanFinish}
                    className="btn-brand-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? t("estimateWizard.creating") : t("estimateWizard.createFullEstimate")}
                  </button>
                ) : (
                  <button onClick={() => setCurrentPhase((p) => p + 1)} className="btn-brand-primary">
                    {t("estimateWizard.nextPhase")}
                  </button>
                )}
              </div>
            </div>

            {/* Summary of configured phases */}
            {phaseEntries.some((p) => !p.skipped && p.area > 0) && (
              <div className="mt-2 border border-brand-cream/10 p-3">
                <p className="font-sans text-[10px] tracking-widest uppercase text-brand-cream-dim mb-3">{t("estimateWizard.phasesConfigured")}</p>
                <ul className="space-y-1.5">
                  {phaseEntries.map((entry, i) => {
                    if (entry.skipped) return null;
                    if (!entry.area || !entry.assemblyId) return null;
                    const ph = PHASES[i];
                    return (
                      <li key={ph.id} className="flex items-center justify-between font-sans text-[11px] text-brand-cream-dim">
                        <span className="text-brand-cream font-semibold">{ph.name}</span>
                        <span>{assemblyNameById.get(entry.assemblyId) ?? entry.assemblyId} · {entry.area} sqft</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}

        {error && (
          <p className="font-sans text-xs text-brand-orange border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 rounded-sm mt-4">
            {error}
          </p>
        )}
      </div>

      {/* ── Results ── */}
      {estimate && (
        <div className="brand-card space-y-6">
          <div className="mb-2">
            <AiAssistantPanel estimateId={String(estimate.id)} />
          </div>

          <div>
            <p className="brand-eyebrow mb-3">{t("estimateWizard.resultEyebrow")}</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: t("estimateWizard.subtotal"), value: estimate.subtotal ?? 0, key: "subtotal" },
                { label: t("estimateWizard.tax"),      value: estimate.tax      ?? 0, key: "tax"      },
                { label: t("estimateWizard.total"),    value: estimate.total    ?? 0, key: "total"    },
              ].map(({ label, value, key }) => (
                <div key={key} className="border border-brand-cream/15 p-3">
                  <p className="font-sans text-[10px] tracking-widest uppercase text-brand-cream-dim mb-1">{label}</p>
                  <p className={`font-serif font-black italic ${key === "total" ? "text-xl text-brand-orange-light" : "text-base text-brand-cream"}`}>
                    ${Number(value).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {!!estimate.lines?.length && (
            <div>
              <p className="brand-eyebrow mb-3">{t("estimateWizard.lineItems")}</p>
              <ul className="divide-y divide-brand-cream/10">
                {estimate.lines.map((line) => (
                  <li key={String(line.id ?? line.assemblyId)} className="py-3 first:pt-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-serif text-sm font-bold italic text-brand-cream">
                        {assemblyNameById.get(String(line.assemblyId)) ?? String(line.assemblyId)}
                      </p>
                      <p className="font-serif text-sm font-bold italic text-brand-orange-light">
                        ${Number(line.lineTotal ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <ul className="space-y-1">
                      {line.items?.map((it, idx) => (
                        <li key={idx} className="font-sans text-[11px] text-brand-cream-dim flex justify-between">
                          <span>{it.name}: {it.qty.toFixed(2)} {it.unit} @ ${it.unitCost.toFixed(2)}</span>
                          <span>${it.extended.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-brand-cream/10">
            <a
              className="font-sans text-[11px] font-semibold tracking-widest uppercase text-brand-cream-dim underline underline-offset-2 hover:text-brand-orange transition-colors"
              href={getProposalPdfUrl(String(estimate.id))}
              target="_blank"
              rel="noreferrer"
            >
              {t("estimateWizard.openPdf")}
            </a>
            <DownloadPdfButton estimateId={String(estimate.id)} />
            <Link
              to={`/proposals/${estimate.id}`}
              className="font-sans text-[11px] font-semibold tracking-widest uppercase text-brand-cream-dim underline underline-offset-2 hover:text-brand-orange transition-colors"
            >
              {t("estimateWizard.viewProposal")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
