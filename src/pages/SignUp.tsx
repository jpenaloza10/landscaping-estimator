import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    // Client-side validation
    if (!name.trim()) {
      setErr("Please enter your name.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setErr("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const result = await signUp(email, password);
      if (result?.error) {
        setErr(result.error);
        return;
      }
      navigate("/projects", { replace: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign up failed";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="brand-eyebrow text-center mb-2">Get started</p>
        <h1 className="font-serif text-4xl font-black italic text-brand-cream text-center mb-8">
          Create Account
        </h1>

        <div className="brand-card">
          {err && (
            <p className="font-sans text-xs text-brand-orange border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 rounded-sm mb-4">
              {err}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-2">
                Name
              </label>
              <input
                className="brand-input"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-2">
                Email
              </label>
              <input
                type="email"
                className="brand-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-2">
                Password
              </label>
              <input
                type="password"
                className="brand-input"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <button disabled={busy} className="btn-brand-primary w-full mt-2">
              {busy ? "Creating…" : "Create Account"}
            </button>
          </form>

          <p className="font-sans text-xs text-center text-brand-cream-dim pt-4 border-t border-brand-cream/10 mt-4">
            Already have an account?{" "}
            <Link className="text-brand-cream underline underline-offset-2 hover:text-brand-orange transition-colors" to="/">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
