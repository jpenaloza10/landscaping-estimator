import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { createProject } from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";

const SCOPE_OPTIONS = [
  "Paver Patio",
  "Artificial Turf",
  "Irrigation",
  "Fence",
  "Plantings",
  "Retaining Wall",
];

export default function ProjectWizard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);

  const STEP_LABELS = [
    t("projectWizard.step_basics"),
    t("projectWizard.step_scope"),
    t("projectWizard.step_location"),
  ];

  const [name,  setName]  = useState("");
  const [notes, setNotes] = useState("");
  const [scope, setScope] = useState<string[]>([]);
  const [location, setLocation] = useState("");

  const [err,     setErr]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleScope(item: string) {
    setScope((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      if (!user) throw new Error(t("projectWizard.mustBeLoggedIn"));
      const description = `Scope: ${scope.join(", ") || "None"}\nNotes: ${notes || "-"}`;
      await createProject({ name, description, location });
      nav("/projects");
    } catch (e: unknown) {
      console.error("Project create error:", e);
      setErr(e instanceof Error ? e.message : "Something went wrong while creating the project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">

      {/* Page header */}
      <div className="mb-8">
        <p className="brand-eyebrow mb-1">{t("projectWizard.eyebrow")}</p>
        <h1 className="font-serif text-4xl font-black italic text-brand-cream">{t("projectWizard.title")}</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {[1, 2, 3].map((n, i) => (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full font-sans text-[11px] font-bold transition-all ${
                  step > n
                    ? "bg-brand-orange text-brand-cream"
                    : step === n
                    ? "bg-brand-cream text-brand-green"
                    : "bg-brand-cream/15 text-brand-cream-dim"
                }`}
              >
                {step > n ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                ) : n}
              </div>
              <span className={`font-sans text-[9px] tracking-[0.14em] uppercase mt-1 ${step === n ? "text-brand-cream" : "text-brand-cream-dim/40"}`}>
                {STEP_LABELS[i]}
              </span>
            </div>
            {n < 3 && (
              <div className={`h-px w-16 sm:w-24 mx-2 mt-[-18px] transition-all ${step > n ? "bg-brand-orange" : "bg-brand-cream/15"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Basics */}
      {step === 1 && (
        <div className="brand-card space-y-5">
          <div>
            <label className="block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-2">
              {t("projectWizard.projectName")} <span className="text-brand-orange">*</span>
            </label>
            <input
              className="brand-input"
              placeholder="e.g. Smith Backyard Renovation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-2">
              {t("projectWizard.notesOptional")}
            </label>
            <textarea
              className="brand-input min-h-[120px] resize-y"
              placeholder={t("projectWizard.notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              className="btn-brand-primary"
              onClick={() => setStep(2)}
              disabled={!name}
            >
              {t("projectWizard.next")}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Scope */}
      {step === 2 && (
        <div className="brand-card space-y-5">
          <div>
            <p className="brand-eyebrow mb-3">{t("projectWizard.selectScope")}</p>
            <div className="grid grid-cols-2 gap-2">
              {SCOPE_OPTIONS.map((opt) => {
                const selected = scope.includes(opt);
                return (
                  <label
                    key={opt}
                    className={`cursor-pointer flex items-center gap-2.5 border rounded-sm p-3 transition-all ${
                      selected
                        ? "border-brand-orange bg-brand-orange/10 text-brand-cream"
                        : "border-brand-cream/20 text-brand-cream-dim hover:border-brand-cream/40"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-all ${
                      selected ? "bg-brand-orange border-brand-orange" : "border-brand-cream/30"
                    }`}>
                      {selected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected}
                      onChange={() => toggleScope(opt)}
                    />
                    <span className="font-sans text-sm font-medium">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {scope.length > 0 && (
            <p className="font-sans text-xs text-brand-orange/80">
              {t("projectWizard.itemsSelected_other", { count: String(scope.length), items: scope.join(", ") })}
            </p>
          )}

          <div className="flex justify-between pt-2">
            <button className="btn-brand-outline" onClick={() => setStep(1)}>{t("projectWizard.back")}</button>
            <button className="btn-brand-primary" onClick={() => setStep(3)}>{t("projectWizard.next")}</button>
          </div>
        </div>
      )}

      {/* Step 3 — Location */}
      {step === 3 && (
        <div className="brand-card space-y-5">
          <div>
            <label className="block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-2">
              {t("projectWizard.projectLocation")} <span className="text-brand-orange">*</span>
            </label>
            <LocationAutocomplete value={location} onChange={setLocation} />
            <p className="font-sans text-xs text-brand-cream-dim/50 mt-1.5">
              {t("projectWizard.locationNote")}
            </p>
          </div>

          {err && (
            <p className="font-sans text-xs text-brand-orange border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 rounded-sm">
              {err}
            </p>
          )}

          <div className="flex justify-between pt-2">
            <button className="btn-brand-outline" onClick={() => setStep(2)}>{t("projectWizard.back")}</button>
            <button
              disabled={loading || !location || !name}
              className="btn-brand-orange disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={submit}
            >
              {loading ? t("projectWizard.creating") : t("projectWizard.createProject")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
