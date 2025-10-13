// pages/Login.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await signIn(email, pw);
      navigate(from, { replace: true });
    } catch (e: any) {
      setErr(e.message || "Login failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto p-6 bg-white rounded-2xl shadow mt-10">
      <h1 className="text-lg font-semibold mb-4">Sign in</h1>
      <input className="w-full border rounded p-2 mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full border rounded p-2 mb-4" placeholder="Password" type="password" value={pw} onChange={e=>setPw(e.target.value)} />
      <button className="w-full rounded bg-slate-900 text-white py-2">Continue</button>
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
    </form>
  );
}
