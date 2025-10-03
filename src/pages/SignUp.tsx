import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
const API = "http://localhost:4000";

export default function SignUp() {
  const { setAuth } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Signup failed");
      setAuth(data.token, data.user);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form onSubmit={submit} className="bg-white w-full max-w-md shadow rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-center text-green-700 mb-4">Create Account</h1>
        <label className="block mb-2 text-sm">Name</label>
        <input className="w-full border rounded p-2 mb-3" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
        <label className="block mb-2 text-sm">Email</label>
        <input type="email" className="w-full border rounded p-2 mb-3" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
        <label className="block mb-2 text-sm">Password</label>
        <input type="password" className="w-full border rounded p-2 mb-4" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required minLength={8} />
        {err && <div className="text-red-600 text-sm mb-3">{err}</div>}
        <button disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded">
          {loading ? "Creating..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
