import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../lib/supabase"; // optional: to save display name to user metadata

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
    setBusy(true);
    try {
      // Create the account via Supabase (through AuthContext)
      await signUp(email, password);

      // Optional: persist the display name to the user's profile/metadata
      // (This will no-op if there is no active session yet due to email confirmation.)
      try {
        await supabase.auth.updateUser({ data: { name } });
      } catch {
        /* ignore non-fatal metadata errors */
      }

      // Navigate to your first protected page
      navigate("/projects", { replace: true });
    } catch (e: any) {
      const msg = e?.message || "Sign up failed";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-4">Create account</h1>

      {err && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 text-red-700 p-3">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            className="w-full border rounded p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <button
          disabled={busy}
          className="w-full bg-green-600 text-white rounded py-2 hover:bg-green-700 disabled:opacity-50"
        >
          {busy ? "Creating..." : "Create account"}
        </button>
      </form>

      <p className="text-sm text-slate-600 mt-3">
        Already have an account?{" "}
        <Link className="text-green-700 underline" to="/">
          Log in
        </Link>
      </p>
    </div>
  );
}
