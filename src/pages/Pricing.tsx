import { useEffect, useState } from "react";
import { getPriceSheet, savePriceSheet, resetPriceSheet, type PriceSheetItem } from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";

// ── Category display config ──────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; labelEs: string; color: string }> = {
  DEMO:       { label: "Demo / Site Prep",              labelEs: "Demo / Preparación del sitio",     color: "text-orange-300 border-orange-400/30 bg-orange-400/10"  },
  SOIL_PREP:  { label: "Soil Preparation",              labelEs: "Preparación del suelo",            color: "text-yellow-300 border-yellow-400/30 bg-yellow-400/10"  },
  IRRIGATION: { label: "Irrigation",                   labelEs: "Irrigación",                       color: "text-blue-300 border-blue-400/30 bg-blue-400/10"        },
  HARDSCAPE:  { label: "Hardscape",                    labelEs: "Paisaje duro",                     color: "text-stone-300 border-stone-400/30 bg-stone-400/10"     },
  CONCRETE:   { label: "Concrete",                     labelEs: "Concreto",                         color: "text-slate-300 border-slate-400/30 bg-slate-400/10"     },
  PLANTING:   { label: "Planting / Sod",               labelEs: "Siembra / Césped",                 color: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10"},
  MULCH_ROCK: { label: "Mulch / Rock",                 labelEs: "Mantillo / Roca",                  color: "text-amber-300 border-amber-400/30 bg-amber-400/10"     },
  LIGHTING:   { label: "Landscape Lighting (Low Volt)", labelEs: "Iluminación de paisaje (baja volt)", color: "text-purple-300 border-purple-400/30 bg-purple-400/10" },
  CLEANUP:    { label: "Cleanup",                      labelEs: "Limpieza final",                   color: "text-teal-300 border-teal-400/30 bg-teal-400/10"        },
  LABOR:      { label: "General Labor",                labelEs: "Mano de obra general",             color: "text-red-300 border-red-400/30 bg-red-400/10"           },
};

const CATEGORY_ORDER = [
  "DEMO", "SOIL_PREP", "IRRIGATION", "HARDSCAPE", "CONCRETE",
  "PLANTING", "MULCH_ROCK", "LIGHTING", "CLEANUP", "LABOR",
];

type EditState = Record<string, { unitPrice: string; unit: string; notes: string }>;

export default function Pricing() {
  const { lang } = useTranslation();
  const [sheet,   setSheet]   = useState<PriceSheetItem[]>([]);
  const [edits,   setEdits]   = useState<EditState>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState<{ text: string; ok: boolean } | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { sheet: data } = await getPriceSheet();
        setSheet(data);
        // Init edit state from loaded values
        const init: EditState = {};
        for (const row of data) {
          init[key(row)] = { unitPrice: String(row.unitPrice), unit: row.unit, notes: row.notes ?? "" };
        }
        setEdits(init);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function key(row: PriceSheetItem) { return `${row.category}__${row.itemName}`; }

  function updateEdit(row: PriceSheetItem, field: "unitPrice" | "unit" | "notes", val: string) {
    setEdits((prev) => ({
      ...prev,
      [key(row)]: { ...prev[key(row)], [field]: val },
    }));
  }

  async function handleSave() {
    setSaving(true); setMsg(null);
    try {
      const items = sheet.map((row) => {
        const e = edits[key(row)];
        return {
          category:  row.category,
          itemName:  row.itemName,
          unit:      e?.unit      ?? row.unit,
          unitPrice: parseFloat(e?.unitPrice ?? String(row.unitPrice)) || 0,
          notes:     e?.notes     || undefined,
        };
      });
      await savePriceSheet(items);
      setMsg({ text: lang === "es" ? "Precios guardados con éxito." : "Prices saved successfully.", ok: true });
    } catch (e) {
      setMsg({ text: lang === "es" ? "Error al guardar." : "Failed to save.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!window.confirm(lang === "es"
      ? "¿Restablecer todos los precios a los valores predeterminados?"
      : "Reset all prices to defaults?")) return;
    setResetting(true); setMsg(null);
    try {
      await resetPriceSheet();
      const { sheet: data } = await getPriceSheet();
      setSheet(data);
      const init: EditState = {};
      for (const row of data) {
        init[key(row)] = { unitPrice: String(row.unitPrice), unit: row.unit, notes: row.notes ?? "" };
      }
      setEdits(init);
      setMsg({ text: lang === "es" ? "Precios restablecidos." : "Prices reset to defaults.", ok: true });
    } catch {
      setMsg({ text: lang === "es" ? "Error al restablecer." : "Failed to reset.", ok: false });
    } finally {
      setResetting(false);
    }
  }

  // Group sheet by category
  const grouped = CATEGORY_ORDER.reduce<Record<string, PriceSheetItem[]>>((acc, cat) => {
    acc[cat] = sheet.filter((r) => r.category === cat);
    return acc;
  }, {});

  const labelClass = "block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-1";

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1,2,3].map((i) => <div key={i} className="brand-card h-32 bg-brand-cream/5" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="brand-eyebrow mb-1">
            {lang === "es" ? "Hoja de precios" : "Price Sheet"}
          </p>
          <h1 className="font-serif text-4xl font-black italic text-brand-cream">
            {lang === "es" ? "Mis tarifas" : "My Rates"}
          </h1>
          <p className="font-sans text-xs text-brand-cream-dim mt-2 max-w-lg leading-relaxed">
            {lang === "es"
              ? "Establece tus tarifas unitarias para materiales y mano de obra. Estos valores se usarán como referencia al crear estimaciones."
              : "Set your unit rates for materials and labor. These values are used as reference pricing when building estimates."}
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="btn-brand-outline text-brand-cream-dim border-brand-cream/20 hover:border-brand-orange hover:text-brand-orange disabled:opacity-40"
          >
            {resetting
              ? (lang === "es" ? "Restableciendo…" : "Resetting…")
              : (lang === "es" ? "Restablecer" : "Reset to Defaults")}
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-brand-primary disabled:opacity-40">
            {saving
              ? (lang === "es" ? "Guardando…" : "Saving…")
              : (lang === "es" ? "Guardar precios" : "Save Prices")}
          </button>
        </div>
      </div>

      {msg && (
        <p className={`font-sans text-xs px-4 py-2.5 border rounded-sm ${msg.ok ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" : "text-brand-orange border-brand-orange/30 bg-brand-orange/10"}`}>
          {msg.text}
        </p>
      )}

      {/* Category sections */}
      {CATEGORY_ORDER.map((cat) => {
        const rows = grouped[cat] ?? [];
        if (rows.length === 0) return null;
        const meta = CATEGORY_META[cat];
        const catLabel = lang === "es" ? meta.labelEs : meta.label;

        return (
          <div key={cat} className="brand-card">
            {/* Category header */}
            <div className="flex items-center gap-3 mb-5">
              <span className={`inline-flex items-center px-2.5 py-1 border font-sans text-[9px] font-semibold tracking-[0.22em] uppercase rounded-sm ${meta.color}`}>
                {catLabel}
              </span>
            </div>

            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-12 gap-3 mb-2 px-1">
              <p className={`${labelClass} col-span-4`}>{lang === "es" ? "Artículo" : "Item"}</p>
              <p className={`${labelClass} col-span-2`}>{lang === "es" ? "Precio unitario" : "Unit Price"}</p>
              <p className={`${labelClass} col-span-2`}>{lang === "es" ? "Unidad" : "Unit"}</p>
              <p className={`${labelClass} col-span-4`}>{lang === "es" ? "Notas" : "Notes"}</p>
            </div>

            {/* Rows */}
            <div className="divide-y divide-brand-cream/10">
              {rows.map((row) => {
                const e = edits[key(row)] ?? { unitPrice: String(row.unitPrice), unit: row.unit, notes: "" };
                return (
                  <div key={key(row)} className="py-3 first:pt-0 last:pb-0">
                    <div className="grid sm:grid-cols-12 gap-3 items-start">
                      {/* Item name */}
                      <div className="sm:col-span-4">
                        <p className="sm:hidden font-sans text-[9px] tracking-widest uppercase text-brand-cream-dim mb-1">
                          {lang === "es" ? "Artículo" : "Item"}
                        </p>
                        <p className="font-sans text-sm text-brand-cream font-medium">
                          {row.itemName}
                          {row.isCustom && (
                            <span className="ml-2 font-sans text-[9px] tracking-widest uppercase text-brand-orange">
                              {lang === "es" ? "Personalizado" : "Custom"}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Unit price */}
                      <div className="sm:col-span-2">
                        <p className="sm:hidden font-sans text-[9px] tracking-widest uppercase text-brand-cream-dim mb-1">
                          {lang === "es" ? "Precio unitario ($)" : "Unit Price ($)"}
                        </p>
                        <div className="flex items-center border border-brand-cream/25 rounded-sm focus-within:border-brand-cream/60 transition-colors">
                          <span className="pl-2 font-sans text-xs text-brand-cream-dim">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="flex-1 bg-transparent px-2 py-1.5 text-sm text-brand-cream font-sans focus:outline-none w-full"
                            value={e.unitPrice}
                            onChange={(ev) => updateEdit(row, "unitPrice", ev.target.value)}
                          />
                        </div>
                      </div>

                      {/* Unit */}
                      <div className="sm:col-span-2">
                        <p className="sm:hidden font-sans text-[9px] tracking-widest uppercase text-brand-cream-dim mb-1">
                          {lang === "es" ? "Unidad" : "Unit"}
                        </p>
                        <input
                          type="text"
                          className="brand-input py-1.5 text-sm"
                          value={e.unit}
                          onChange={(ev) => updateEdit(row, "unit", ev.target.value)}
                          placeholder="sqft / yard / ton…"
                        />
                      </div>

                      {/* Notes */}
                      <div className="sm:col-span-4">
                        <p className="sm:hidden font-sans text-[9px] tracking-widest uppercase text-brand-cream-dim mb-1">
                          {lang === "es" ? "Notas" : "Notes"}
                        </p>
                        <input
                          type="text"
                          className="brand-input py-1.5 text-sm"
                          value={e.notes}
                          onChange={(ev) => updateEdit(row, "notes", ev.target.value)}
                          placeholder={lang === "es" ? "Notas opcionales…" : "Optional notes…"}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Save button (bottom) */}
      <div className="flex justify-end gap-3 pt-2">
        {msg && (
          <p className={`font-sans text-xs self-center ${msg.ok ? "text-emerald-400" : "text-brand-orange"}`}>
            {msg.text}
          </p>
        )}
        <button onClick={handleSave} disabled={saving} className="btn-brand-primary disabled:opacity-40">
          {saving
            ? (lang === "es" ? "Guardando…" : "Saving…")
            : (lang === "es" ? "Guardar precios" : "Save Prices")}
        </button>
      </div>
    </div>
  );
}
