import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API = "https://landscaping-backend-sbhw.onrender.com";

export default function SignUp() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const emailOk = /\S+@\S+\.\S+/.test(form.email);
  const passwordOk = form.password.length >= 8;
  const canSubmit = form.name.trim() && emailOk && passwordOk && !loading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let data: any = {};
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        if (res.status === 409) throw new Error(data.error || "Email already in use");
        if (res.status === 400) throw new Error(data.error || "Missing or invalid fields");
        throw new Error(data.error || `Signup failed (HTTP ${res.status})`);
      }

      setAuth(data.token, data.user);
      navigate("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Network error — check server and CORS");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form onSubmit={submit} className="bg-white w-full max-w-md shadow rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-center text-green-700 mb-4">Create Account</h1>

        <label className="block mb-2 text-sm">Name</label>
        <input
          className="w-full border rounded p-2 mb-3"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          autoComplete="name"
          required
        />

        <label className="block mb-2 text-sm">Email</label>
        <input
          type="email"
          className={`w-full border rounded p-2 mb-1 ${form.email && !emailOk ? "border-red-400" : ""}`}
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          autoComplete="email"
          required
        />
        {!emailOk && form.email && (
          <div className="text-xs text-red-600 mb-2">Please enter a valid email.</div>
        )}

        <label className="block mb-2 text-sm">Password</label>
        <div className="flex items-center gap-2 mb-1">
          <input
            type={showPw ? "text" : "password"}
            className={`w-full border rounded p-2 ${form.password && !passwordOk ? "border-red-400" : ""}`}
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
        {!passwordOk && form.password && (
          <div className="text-xs text-red-600 mb-2">Password must be at least 8 characters.</div>
        )}

        {err && <div className="text-red-600 text-sm mb-3">{err}</div>}

        <button
          disabled={!canSubmit}
          className={`w-full ${canSubmit ? "bg-green-600 hover:bg-green-700" : "bg-gray-300"} text-white font-semibold py-2 rounded transition`}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p className="text-sm text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-green-700 font-medium hover:underline">Login</a>
        </p>
      </form>
    </div>
  );
}
