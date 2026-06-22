import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type LocationState = {
  from?: { pathname?: string };
};

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState)?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email || !pw) {
      setErr("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await signIn(email, pw);
      if (error) {
        setErr(error);
        return;
      }
      navigate(from, { replace: true });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Heading */}
        <p className="brand-eyebrow text-center mb-2">Welcome back</p>
        <h1 className="font-serif text-4xl font-black italic text-brand-cream text-center mb-8">
          Sign In
        </h1>

        {/* Card */}
        <div className="brand-card space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-2">
                Email
              </label>
              <input
                className="brand-input"
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-2">
                Password
              </label>
              <div className="flex items-center border border-brand-cream/30 rounded-sm focus-within:border-brand-cream/70 transition-colors">
                <input
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-brand-cream placeholder-brand-cream-dim/50 focus:outline-none"
                  placeholder="••••••••"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                />
                <button
                  type="button"
                  className="pr-3 font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-cream-dim hover:text-brand-cream transition-colors"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {err && (
              <p className="font-sans text-xs text-brand-orange border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 rounded-sm">
                {err}
              </p>
            )}

            <button className="btn-brand-primary w-full mt-2" disabled={loading}>
              {loading ? "Please wait…" : "Sign In"}
            </button>
          </form>

          <p className="font-sans text-xs text-center text-brand-cream-dim pt-2 border-t border-brand-cream/10">
            No account?{" "}
            <Link className="text-brand-cream underline underline-offset-2 hover:text-brand-orange transition-colors" to="/signup">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
