// e.g., src/components/ReceiptUpload.tsx
import { useState } from "react";
import { supabase } from "../lib/supabase"; // createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

export default function ReceiptUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");

  async function handleUpload() {
    try {
      if (!file) return;

      // 1) Ask backend for signed upload token
      const filePath = `user/${crypto.randomUUID()}-${file.name}`;
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/uploads/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fileName: filePath })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to get signed URL");

      // 2) Upload directly to Supabase with token + contentType HERE
      const { data, error } = await supabase.storage
        .from("receipts")
        .uploadToSignedUrl(json.path, json.token, file, {
          upsert: true,
          contentType: file.type, // ✅ belongs here
        });

      if (error) throw error;
      setMsg(`Uploaded: ${data?.path}`);
    } catch (e:any) {
      setMsg(e.message);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="font-medium mb-2">Upload Receipt</h3>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <button onClick={handleUpload} className="mt-2 rounded bg-slate-900 text-white px-3 py-2">
        Upload
      </button>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </div>
  );
}
