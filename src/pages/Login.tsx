// pages/Login.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type LocationState = {
  from?: { pathname?: string };
};

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState)?.from?.pathname || "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!email || !pw) {
      setErr("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      if (mode === "signin") {
        const { error } = await signIn(email, pw);
        if (error) {
          setErr(error);
          return;
        }
        // success
        navigate(from, { replace: true });
      } else {
        // signup
        const { error, needsConfirm } = await signUp(email, pw);
        if (error) {
          setErr(error);
          return;
        }
        if (needsConfirm) {
          setMsg("Account created. Please check your email to confirm your account.");
          // stay on page; user must confirm
          return;
        }
        // if email confirmation is off, you may have a session immediately:
        setMsg("Account created and signed in!");
        navigate(from, { replace: true });
      }
    } catch (e: any) {
      setErr(e?.message ?? "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6 bg-white rounded-2xl shadow mt-10">
      {/* Mode toggle */}
      <div className="mb-4 inline-flex rounded-lg border overflow-hidden">
        <button
          type="button"
          className={`px-3 py-2 text-sm ${mode === "signin" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          onClick={() => { setMode("signin"); setErr(null); setMsg(null); }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`px-3 py-2 text-sm ${mode === "signup" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          onClick={() => { setMode("signup"); setErr(null); setMsg(null); }}
        >
          Create account
        </button>
      </div>

      <h1 className="text-lg font-semibold mb-4">
        {mode === "signin" ? "Sign in" : "Create your account"}
      </h1>

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
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
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
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>

      {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
      {msg && <p className="text-sm text-green-700 mt-3">{msg}</p>}

      {mode === "signin" && (
        <p className="mt-3 text-xs text-slate-500">
          Trouble signing in? Make sure your email is confirmed if your workspace requires it.
        </p>
      )}
    </div>
  );
}
