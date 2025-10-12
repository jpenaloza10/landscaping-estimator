import { useState } from "react";
import { supabase } from "../lib/supabase";

export function ReceiptUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");

  async function upload() {
    if (!file) return;
    const { data, error } = await supabase.storage
      .from("receipts")
      .upload(`user/${crypto.randomUUID()}-${file.name}`, file, { upsert: true });

    setMsg(error ? error.message : `Uploaded: ${data?.path}`);
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="font-medium mb-2">Upload Receipt</h3>
      <input type="file" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
      <button onClick={upload} className="mt-2 rounded bg-slate-900 text-white px-3 py-2">Upload</button>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </div>
  );
}
