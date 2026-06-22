import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

/* ─────────────────────────────────────────────
   LANDING NAV  (preview dropdown + login/signup)
───────────────────────────────────────────── */
function LandingNav() {
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const linkCls =
    "font-sans text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors text-brand-green hover:text-brand-orange";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-cream border-b border-brand-green/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 h-[60px] flex items-center justify-between">

        {/* Left — Preview dropdown */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Preview">
          <div ref={dropRef} className="relative">
            <button
              onClick={() => setDropOpen((v) => !v)}
              className={`${linkCls} flex items-center gap-1.5`}
              aria-haspopup="true"
              aria-expanded={dropOpen}
            >
              Preview
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none"
                className={`transition-transform ${dropOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {dropOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-brand-cream border border-brand-green/10 shadow-lg rounded-sm overflow-hidden">
                <div className="px-3 py-2 border-b border-brand-green/10">
                  <p className="font-sans text-[9px] font-semibold tracking-[0.22em] uppercase text-brand-orange">
                    Sample Pages
                  </p>
                </div>
                {[
                  { label: "Projects",  to: "/demo/projects",  icon: FolderIcon },
                  { label: "Estimates", to: "/demo/estimates", icon: CalcIcon },
                  { label: "Expenses",  to: "/demo/expenses",  icon: WalletIcon },
                ].map(({ label, to, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-brand-green/5 transition-colors group"
                  >
                    <span className="w-7 h-7 rounded-full bg-brand-green/10 flex items-center justify-center group-hover:bg-brand-green/20 transition-colors">
                      <Icon className="w-3.5 h-3.5 text-brand-green" />
                    </span>
                    <span className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-brand-green group-hover:text-brand-orange transition-colors">
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Centre wordmark */}
        <Link
          to="/"
          className="font-serif text-lg font-bold italic text-brand-green tracking-wide absolute left-1/2 -translate-x-1/2"
        >
          Landscaping Estimator
        </Link>

        {/* Right — Login + Get Started */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Auth">
          <Link to="/login" className={linkCls}>Log In</Link>
          <Link
            to="/signup"
            className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase bg-brand-orange text-brand-cream px-5 py-2.5 border-2 border-brand-orange transition-all hover:bg-transparent hover:text-brand-orange"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden ml-auto text-brand-green p-2"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-brand-green/10 bg-brand-cream">
          <nav className="px-4 py-4 flex flex-col gap-3">
            <p className="font-sans text-[9px] font-semibold tracking-[0.22em] uppercase text-brand-orange pt-1">Preview</p>
            <Link to="/demo/projects"  onClick={() => setMobileOpen(false)} className={linkCls}>Projects</Link>
            <Link to="/demo/estimates" onClick={() => setMobileOpen(false)} className={linkCls}>Estimates</Link>
            <Link to="/demo/expenses"  onClick={() => setMobileOpen(false)} className={linkCls}>Expenses</Link>
            <div className="border-t border-brand-green/10 pt-3 mt-1 flex flex-col gap-3">
              <Link to="/login"  onClick={() => setMobileOpen(false)} className={linkCls}>Log In</Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className={`${linkCls} text-brand-orange`}>Get Started →</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ─────────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen bg-brand-green text-brand-cream antialiased font-sans" style={{ backgroundColor: "#1B3A1E", color: "#F4EFE4" }}>
      <LandingNav />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-[60px] overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(36,63,39,0.55) 0%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl w-full mx-auto">
          <p className="font-serif text-xl font-normal italic tracking-[0.25em] uppercase text-brand-cream-dim mb-0.5">
            The
          </p>
          <h1
            className="font-serif font-black italic text-brand-cream leading-[0.88] tracking-tight"
            style={{ fontSize: "clamp(72px, 13vw, 130px)" }}
          >
            Landscaping
          </h1>
          <p
            className="font-serif font-bold italic text-brand-cream tracking-wide mb-10"
            style={{ fontSize: "clamp(30px, 5.5vw, 58px)" }}
          >
            Estimator
          </p>

          {/* Badge */}
          <div className="inline-block relative px-12 py-4 border-2 border-brand-cream/70 rounded-sm mb-12">
            {/* Left notch */}
            <span
              className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-brand-cream rounded-full"
              style={{ boxShadow: "0 0 0 4px #1B3A1E, 0 0 0 6px #F4EFE4" }}
              aria-hidden="true"
            />
            {/* Right notch */}
            <span
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-brand-cream rounded-full"
              style={{ boxShadow: "0 0 0 4px #1B3A1E, 0 0 0 6px #F4EFE4" }}
              aria-hidden="true"
            />
            <p className="font-sans text-[10px] font-semibold tracking-[0.22em] uppercase text-brand-orange mb-0.5">
              Build Your
            </p>
            <p className="font-script text-3xl text-brand-cream leading-tight">
              perfect estimate
            </p>
          </div>

          {/* CTAs */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/signup"
              className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-brand-green bg-brand-cream border-2 border-brand-cream px-9 py-4 transition-all hover:bg-transparent hover:text-brand-cream"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-brand-cream bg-transparent border-2 border-brand-cream px-9 py-4 transition-all hover:bg-brand-cream hover:text-brand-green"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <a
          href="#features"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-40 hover:opacity-70 transition-opacity"
          aria-label="Scroll down"
          style={{ animation: "bounce 2s infinite" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </a>

        <style>{`@keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(6px)} }`}</style>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="bg-brand-cream py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="brand-eyebrow text-center mb-3">Everything you need</p>
          <h2
            className="font-serif font-black italic text-brand-green text-center mb-14"
            style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
          >
            Built for the field
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {FEATURES.map((f) => (
              <div key={f.title} className="text-center">
                <div className="w-13 h-13 mx-auto mb-4 bg-brand-green rounded-full flex items-center justify-center" style={{width:52,height:52}}>
                  <f.Icon className="w-6 h-6 text-brand-cream" />
                </div>
                <h3 className="font-serif text-lg font-bold text-brand-green mb-2">{f.title}</h3>
                <p className="text-sm text-brand-green/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAMPLE SECTIONS ── */}
      <SampleSection
        eyebrow="Projects"
        heading="Organise every job"
        body="Keep all your active and completed landscaping jobs in one place. Each project holds its own estimates, expenses, and proposal PDFs — no more hunting through folders."
        cta="View sample projects"
        ctaTo="/demo/projects"
        preview={<ProjectsPreview />}
        flipped={false}
      />
      <SampleSection
        eyebrow="Estimates"
        heading="Instant cost breakdowns"
        body="Pick an assembly, enter square footage and your ZIP code — labour rates and material costs are applied automatically. Download a client-ready PDF with one click."
        cta="View sample estimates"
        ctaTo="/demo/estimates"
        preview={<EstimatesPreview />}
        flipped={true}
      />
      <SampleSection
        eyebrow="Expenses"
        heading="Track every dollar"
        body="Log receipts against any project and watch your budget utilisation update in real time. Spot overruns before they become problems."
        cta="View sample expenses"
        ctaTo="/demo/expenses"
        preview={<ExpensesPreview />}
        flipped={false}
      />

      {/* ── FINAL CTA ── */}
      <section className="bg-brand-green-mid py-20 px-6 text-center">
        <p className="brand-eyebrow mb-3">Ready to start?</p>
        <h2
          className="font-serif font-black italic text-brand-cream mb-6"
          style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
        >
          Your first estimate is free
        </h2>
        <p className="font-sans text-sm text-brand-cream-dim max-w-md mx-auto mb-10 leading-relaxed">
          Create an account in seconds and start building professional landscaping estimates today. No credit card required.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/signup"
            className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-brand-green bg-brand-cream border-2 border-brand-cream px-10 py-4 transition-all hover:bg-transparent hover:text-brand-cream"
          >
            Create Free Account
          </Link>
          <Link
            to="/login"
            className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-brand-cream bg-transparent border-2 border-brand-cream px-10 py-4 transition-all hover:bg-brand-cream hover:text-brand-green"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-brand-green-dark border-t border-brand-cream/10 py-8 px-8 flex flex-wrap items-center justify-between gap-4">
        <span className="font-serif text-base italic font-bold text-brand-cream">Landscaping Estimator</span>
        <span className="font-sans text-[11px] tracking-widest uppercase text-brand-cream-dim opacity-50">
          © {new Date().getFullYear()} · All rights reserved
        </span>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SAMPLE SECTION wrapper
───────────────────────────────────────────── */
function SampleSection({
  eyebrow, heading, body, cta, ctaTo, preview, flipped,
}: {
  eyebrow: string; heading: string; body: string;
  cta: string; ctaTo: string; preview: React.ReactNode; flipped: boolean;
}) {
  return (
    <section className="py-20 px-6">
      <div
        className={`max-w-6xl mx-auto flex flex-col gap-12 items-center ${
          flipped ? "lg:flex-row-reverse" : "lg:flex-row"
        }`}
      >
        {/* Text */}
        <div className="flex-1 max-w-md">
          <p className="brand-eyebrow mb-3">{eyebrow}</p>
          <h2
            className="font-serif font-black italic text-brand-cream mb-5"
            style={{ fontSize: "clamp(28px, 3.5vw, 42px)" }}
          >
            {heading}
          </h2>
          <p className="font-sans text-sm text-brand-cream-dim leading-relaxed mb-8">{body}</p>
          <Link
            to={ctaTo}
            className="inline-flex items-center gap-2 font-sans text-[11px] font-bold tracking-[0.18em] uppercase text-brand-green bg-brand-cream border-2 border-brand-cream px-7 py-3.5 transition-all hover:bg-transparent hover:text-brand-cream"
          >
            {cta}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {/* Preview card */}
        <div className="flex-1 w-full max-w-lg">
          {preview}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   MINI PREVIEW CARDS (inline mockups)
───────────────────────────────────────────── */
function ProjectsPreview() {
  const projects = [
    { name: "Riverside Backyard Overhaul", status: "Active",    value: "$8,400" },
    { name: "Oak Street Front Garden",    status: "Completed",  value: "$3,250" },
    { name: "Sunnyvale HOA Commons",      status: "Estimating", value: "$14,800" },
  ];
  return (
    <div className="brand-card space-y-3">
      <p className="brand-eyebrow mb-4">3 Active Projects</p>
      {projects.map((p) => (
        <div key={p.name} className="flex items-center justify-between border-b border-brand-cream/10 pb-3 last:border-0 last:pb-0">
          <div>
            <p className="font-serif text-sm font-bold text-brand-cream italic">{p.name}</p>
            <span className={`font-sans text-[10px] font-semibold tracking-wider uppercase mt-0.5 inline-block ${
              p.status === "Active" ? "text-brand-orange" :
              p.status === "Completed" ? "text-brand-cream-dim" :
              "text-brand-orange-light"
            }`}>{p.status}</span>
          </div>
          <p className="font-serif font-bold text-brand-cream-dim text-sm">{p.value}</p>
        </div>
      ))}
    </div>
  );
}

function EstimatesPreview() {
  const rows = [
    { label: "Sod material (1,200 sqft)", value: "$1,320.00" },
    { label: "Soil prep & grading",       value: "$480.00"   },
    { label: "Edging & borders",          value: "$145.00"   },
    { label: "Delivery",                  value: "$95.00"    },
    { label: "Sales tax (9.25%)",         value: "$188.68"   },
  ];
  return (
    <div className="brand-card">
      <p className="brand-eyebrow mb-1">Sod Installation</p>
      <p className="font-sans text-xs text-brand-cream-dim/60 mb-4">1,200 sqft · San Jose, CA 95110</p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between items-center text-sm text-brand-cream-dim border-b border-brand-cream/8 pb-2 last:border-0">
            <span>{r.label}</span>
            <span className="font-serif font-bold text-brand-cream text-sm">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t-2 border-brand-cream/25 flex justify-between items-center">
        <span className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-cream-dim">Total</span>
        <span className="font-serif text-2xl font-black text-brand-orange-light">$2,228.68</span>
      </div>
    </div>
  );
}

function ExpensesPreview() {
  const expenses = [
    { vendor: "SodSource Inc.",      category: "Materials", amount: "$1,320.00", date: "Mar 18" },
    { vendor: "Lowe's",              category: "Materials", amount: "$218.45",   date: "Mar 20" },
    { vendor: "Manuel's Grading Co", category: "Labour",   amount: "$480.00",   date: "Mar 21" },
  ];
  return (
    <div className="brand-card">
      <div className="flex items-center justify-between mb-4">
        <p className="brand-eyebrow">Recent Expenses</p>
        <p className="font-serif font-bold text-brand-orange-light text-lg">$2,018.45</p>
      </div>
      <div className="space-y-3">
        {expenses.map((e) => (
          <div key={e.vendor} className="flex items-center justify-between gap-3 border-b border-brand-cream/10 pb-3 last:border-0 last:pb-0">
            <div>
              <p className="font-sans text-sm font-semibold text-brand-cream">{e.vendor}</p>
              <p className="font-sans text-[10px] tracking-wider uppercase text-brand-cream-dim/60">{e.category}</p>
            </div>
            <div className="text-right">
              <p className="font-serif font-bold text-brand-cream text-sm">{e.amount}</p>
              <p className="font-sans text-[10px] text-brand-cream-dim/50">{e.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FEATURES DATA
───────────────────────────────────────────── */
const FEATURES = [
  {
    title: "Instant Estimates",
    desc:  "Select an assembly, enter square footage, and get a fully itemised cost breakdown in seconds.",
    Icon:  ClipboardIcon,
  },
  {
    title: "Live Pricing",
    desc:  "Regional labour rates and material costs applied automatically based on your ZIP code.",
    Icon:  ClockIcon,
  },
  {
    title: "Proposal PDFs",
    desc:  "Generate client-ready proposal documents with one click, straight from any estimate.",
    Icon:  PencilIcon,
  },
  {
    title: "Budget Tracking",
    desc:  "Log expenses against projects and watch your gross profit update in real time.",
    Icon:  PulseIcon,
  },
];

/* ─────────────────────────────────────────────
   INLINE SVG ICONS
───────────────────────────────────────────── */
function ClipboardIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
    </svg>
  );
}
function ClockIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  );
}
function PencilIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  );
}
function PulseIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}
function FolderIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  );
}
function CalcIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h4"/>
    </svg>
  );
}
function WalletIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V6H4a2 2 0 000 4h16v6a2 2 0 01-2 2H4"/><circle cx="16" cy="15" r="1" fill="currentColor"/>
    </svg>
  );
}
