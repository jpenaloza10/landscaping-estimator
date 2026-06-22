import { useState } from "react";
import { Link } from "react-router-dom";
import DemoShell from "./DemoShell";

/* Sample estimate data */
const ESTIMATES = [
  {
    id: 1,
    project: "Riverside Backyard Overhaul",
    assembly: "Sod Installation",
    sqft: 1200,
    zip: "95110",
    created: "Mar 18, 2026",
    lineItems: [
      { label: "Sod material (Bermuda blend)",     amount: 1320.00 },
      { label: "Soil prep & finish grading",        amount: 480.00 },
      { label: "Concrete edging & borders",         amount: 145.00 },
      { label: "Delivery (allocated)",              amount: 95.00  },
      { label: "Sales tax (9.25%)",                 amount: 188.68 },
    ],
    total: 2228.68,
  },
  {
    id: 2,
    project: "Riverside Backyard Overhaul",
    assembly: "Drip Irrigation System",
    sqft: 1200,
    zip: "95110",
    created: "Mar 19, 2026",
    lineItems: [
      { label: "Drip emitters & tubing (1,200 lf)", amount: 840.00 },
      { label: "Backflow preventer & filter",        amount: 210.00 },
      { label: "Timer / controller unit",            amount: 175.00 },
      { label: "Installation labour",                amount: 620.00 },
      { label: "Sales tax (9.25%)",                  amount: 168.78 },
    ],
    total: 2013.78,
  },
  {
    id: 3,
    project: "Palo Alto Drought-Tolerant Redesign",
    assembly: "Decomposed Granite Pathway",
    sqft: 320,
    zip: "94301",
    created: "Feb 28, 2026",
    lineItems: [
      { label: "Decomposed granite (3\" depth)",  amount: 320.00 },
      { label: "Weed barrier fabric",             amount: 68.00  },
      { label: "Steel edging (140 lf)",           amount: 112.00 },
      { label: "Labour — install & compact",      amount: 390.00 },
      { label: "Sales tax (9.25%)",               amount: 45.52  },
    ],
    total: 935.52,
  },
];

export default function SampleEstimates() {
  const [selected, setSelected] = useState(0);
  const est = ESTIMATES[selected];

  return (
    <DemoShell activeTab="estimates">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="brand-eyebrow mb-1">Cost Breakdowns</p>
          <h1 className="font-serif text-4xl font-black italic text-brand-cream">Estimates</h1>
        </div>
        <button
          onClick={() => alert("Sign up to build real estimates!")}
          className="btn-brand-orange"
        >
          + New Estimate
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

        {/* Left — estimate detail */}
        <div className="brand-card">
          {/* Estimate selector tabs */}
          <div className="flex gap-0 mb-6 border border-brand-cream/15 rounded-sm overflow-hidden">
            {ESTIMATES.map((e, i) => (
              <button
                key={e.id}
                onClick={() => setSelected(i)}
                className={`flex-1 px-3 py-2.5 text-left transition-colors ${
                  i === selected
                    ? "bg-brand-cream/10 border-r border-brand-cream/10"
                    : "hover:bg-brand-cream/5 border-r border-brand-cream/10"
                } last:border-r-0`}
              >
                <p className={`font-sans text-[10px] font-semibold tracking-[0.14em] uppercase ${i === selected ? "text-brand-orange" : "text-brand-cream-dim/60"}`}>
                  {e.assembly}
                </p>
                <p className="font-sans text-[10px] text-brand-cream-dim/40 mt-0.5 truncate">{e.project}</p>
              </button>
            ))}
          </div>

          {/* Header */}
          <div className="mb-6 pb-4 border-b border-brand-cream/15">
            <p className="brand-eyebrow mb-1">{est.assembly}</p>
            <h2 className="font-serif text-2xl font-bold italic text-brand-cream mb-1">{est.project}</h2>
            <p className="font-sans text-xs text-brand-cream-dim/50">
              {est.sqft.toLocaleString()} sqft · ZIP {est.zip} · Created {est.created}
            </p>
          </div>

          {/* Line items */}
          <div className="space-y-0">
            {est.lineItems.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-brand-cream/8 last:border-0"
              >
                <span className="font-sans text-sm text-brand-cream-dim">{row.label}</span>
                <span className="font-serif font-bold text-brand-cream text-sm ml-4 shrink-0">
                  ${row.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-5 pt-5 border-t-2 border-brand-cream/25 flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-cream-dim">
              Total
            </span>
            <span className="font-serif text-3xl font-black text-brand-orange-light">
              ${est.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* PDF action */}
          <div className="mt-6 pt-5 border-t border-brand-cream/10 flex gap-3">
            <button
              onClick={() => alert("Sign up to download real PDFs!")}
              className="btn-brand-primary flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Download PDF
            </button>
            <button
              onClick={() => alert("Sign up to edit estimates!")}
              className="btn-brand-outline"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Right — summary sidebar */}
        <div className="space-y-4">
          <div className="brand-card">
            <p className="brand-eyebrow mb-4">All Estimates</p>
            {ESTIMATES.map((e, i) => (
              <button
                key={e.id}
                onClick={() => setSelected(i)}
                className={`w-full text-left flex items-center justify-between gap-3 py-3 border-b border-brand-cream/10 last:border-0 transition-colors ${
                  i === selected ? "opacity-100" : "opacity-60 hover:opacity-90"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-sans text-xs font-semibold text-brand-cream truncate">{e.assembly}</p>
                  <p className="font-sans text-[10px] text-brand-cream-dim/50 truncate">{e.project}</p>
                </div>
                <p className="font-serif font-bold text-brand-cream shrink-0 text-sm">
                  ${e.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </button>
            ))}

            <div className="mt-3 pt-3 border-t border-brand-cream/25 flex items-center justify-between">
              <span className="font-sans text-[10px] font-semibold tracking-wider uppercase text-brand-cream-dim">Combined</span>
              <span className="font-serif font-black text-brand-orange-light text-lg">
                ${ESTIMATES.reduce((s, e) => s + e.total, 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Assemblies hint */}
          <div className="brand-card py-6 text-center">
            <p className="brand-eyebrow mb-2">Supported Assemblies</p>
            <ul className="space-y-1.5 mt-3">
              {["Sod Installation", "Drip Irrigation", "Hardscape / DG", "Mulch & Groundcover", "Tree & Shrub", "Turf Removal"].map((a) => (
                <li key={a} className="font-sans text-xs text-brand-cream-dim/70 flex items-center gap-2 justify-center">
                  <span className="w-1 h-1 rounded-full bg-brand-orange inline-block" />
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <div className="brand-card text-center py-6">
            <p className="font-sans text-xs text-brand-cream-dim mb-4 leading-relaxed">
              Sign up to build estimates with your own projects, assemblies, and ZIP codes.
            </p>
            <Link to="/signup" className="btn-brand-primary">
              Get Started →
            </Link>
          </div>
        </div>
      </div>
    </DemoShell>
  );
}
