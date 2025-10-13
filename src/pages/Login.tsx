// src/pages/Login.tsx
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
    } catch (e: any) {
      setErr(e?.message ?? "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6 bg-white rounded-2xl shadow mt-10">
      <h1 className="text-lg font-semibold mb-4">Sign in</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full border rounded p-2"
          placeholder="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="w-full border rounded flex items-center pr-2">
          <input
            className="w-full p-2 rounded-l"
            placeholder="Password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button
            type="button"
            className="text-xs text-slate-600"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>

        <button
          className="w-full rounded bg-slate-900 text-white py-2 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Please wait…" : "Sign in"}
        </button>
      </form>

      {err && <p className="text-sm text-red-600 mt-3">{err}</p>}

      <p className="mt-4 text-sm text-slate-700">
        Don’t have an account?{" "}
        <Link className="text-green-700 underline" to="/signup">
          Sign up
        </Link>
      </p>

      <p className="mt-3 text-xs text-slate-500">
        Trouble signing in? Make sure your email is confirmed if your workspace requires it.
      </p>
    </div>
  );
}
