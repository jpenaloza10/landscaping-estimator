import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Account() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSignUp() {
    const { error } = await supabase.auth.signUp({ email, password: pw });
    setMsg(error ? error.message : "Check your email to confirm.");
  }

  async function handleSignIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setMsg(error ? error.message : "Signed in!");
  }

  return (
    <div className="max-w-md mx-auto bg-white p-4 rounded-2xl shadow">
      <h2 className="font-semibold mb-4">Account</h2>
      <input className="w-full border rounded p-2 mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
      <input className="w-full border rounded p-2 mb-4" placeholder="Password" type="password" value={pw} onChange={e=>setPw(e.target.value)}/>
      <div className="flex gap-2">
        <button onClick={handleSignUp} className="rounded bg-slate-900 text-white px-3 py-2">Sign up</button>
        <button onClick={handleSignIn} className="rounded border px-3 py-2">Sign in</button>
      </div>
      {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
