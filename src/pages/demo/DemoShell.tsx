import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  activeTab: "projects" | "estimates" | "expenses";
}

export default function DemoShell({ children, activeTab }: Props) {
  const tabs = [
    { label: "Projects",  to: "/demo/projects"  },
    { label: "Estimates", to: "/demo/estimates" },
    { label: "Expenses",  to: "/demo/expenses"  },
  ] as const;

  const linkCls = (tab: string) =>
    `font-sans text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors ${
      activeTab === tab
        ? "text-brand-orange"
        : "text-brand-green hover:text-brand-orange"
    }`;

  return (
    <div className="min-h-screen bg-brand-green text-brand-cream antialiased font-sans" style={{ backgroundColor: "#1B3A1E", color: "#F4EFE4" }}>
      {/* NAV */}
      <header className="sticky top-0 z-50 bg-brand-cream border-b border-brand-green/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 h-[60px] flex items-center justify-between">
          {/* Left — demo tabs */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Demo tabs">
            {tabs.map((t) => (
              <Link key={t.to} to={t.to} className={linkCls(t.label.toLowerCase())}>
                {t.label}
              </Link>
            ))}
          </nav>

          {/* Centre — wordmark */}
          <Link
            to="/"
            className="font-serif text-lg font-bold italic text-brand-green tracking-wide absolute left-1/2 -translate-x-1/2"
          >
            Landscaping Estimator
          </Link>

          {/* Right — auth links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Auth">
            <Link
              to="/login"
              className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-green hover:text-brand-orange transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase bg-brand-orange text-brand-cream px-5 py-2.5 border-2 border-brand-orange transition-all hover:bg-transparent hover:text-brand-orange"
            >
              Get Started
            </Link>
          </nav>

          {/* Mobile — back link */}
          <div className="md:hidden flex items-center gap-4 ml-auto">
            <Link
              to="/"
              className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-green hover:text-brand-orange transition-colors"
            >
              ← Home
            </Link>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden border-t border-brand-green/10 bg-brand-cream px-4 py-3 flex gap-6">
          {tabs.map((t) => (
            <Link key={t.to} to={t.to} className={linkCls(t.label.toLowerCase())}>
              {t.label}
            </Link>
          ))}
        </div>
      </header>

      {/* SAMPLE BANNER */}
      <div className="bg-brand-orange/10 border-b border-brand-orange/20 px-4 py-3 text-center">
        <p className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-brand-orange">
          Sample Preview &mdash; This is demo data.{" "}
          <Link to="/signup" className="underline hover:opacity-70 transition-opacity">
            Sign up for the real thing →
          </Link>
        </p>
      </div>

      {/* CONTENT */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-8">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-brand-green-dark border-t border-brand-cream/10 py-8 px-8 flex flex-wrap items-center justify-between gap-4 mt-12">
        <Link to="/" className="font-serif text-base italic font-bold text-brand-cream hover:text-brand-orange transition-colors">
          Landscaping Estimator
        </Link>
        <Link
          to="/signup"
          className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase bg-brand-orange text-brand-cream px-6 py-2.5 border-2 border-brand-orange transition-all hover:bg-transparent hover:text-brand-orange"
        >
          Create Free Account
        </Link>
      </footer>
    </div>
  );
}
