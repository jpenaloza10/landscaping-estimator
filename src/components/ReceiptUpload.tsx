// src/components/ReceiptUpload.tsx
import { useState } from "react";
import { supabase } from "../lib/supabase"; // createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

interface ReceiptUploadProps {
  projectId: string;
  onCreated?: () => void; // optional callback to refresh expenses/budget after auto-expense is created
}

export default function ReceiptUpload({ projectId, onCreated }: ReceiptUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    try {
      if (!file) return;
      if (!projectId) {
        setMsg("Missing projectId for receipt upload.");
        return;
      }

      setLoading(true);
      setMsg("Requesting signed URL...");

      // 1) Ask backend for signed upload token
      const filePath = `user/${crypto.randomUUID()}-${file.name}`;
      const signRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/uploads/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ fileName: filePath }),
        }
      );

      const signJson = await signRes.json();
      if (!signRes.ok) {
        throw new Error(signJson.error || "Failed to get signed upload URL");
      }

      // signJson should contain: { path, token }
      const { path, token } = signJson;
      if (!path || !token) {
        throw new Error("Signed URL response missing path or token");
      }

      setMsg("Uploading to storage...");

      // 2) Upload directly to Supabase signed URL
      const { data, error } = await supabase.storage
        .from("receipts")
        .uploadToSignedUrl(path, token, file, {
          upsert: true,
          contentType: file.type || "application/octet-stream",
        });

      if (error) throw error;

      const finalPath = data?.path || path;

      setMsg("Running OCR and creating expense...");

      // 3) Tell backend to OCR + create draft Expense tied to this project
      const ingestRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/expenses/receipt/ingest`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            projectId,
            receiptPath: finalPath,
          }),
        }
      );

      const ingestJson = await ingestRes.json();
      if (! ingestRes.ok) {
        throw new Error(ingestJson.error || "Failed to process receipt");
      }

      setMsg(
        `Receipt processed. Created expense draft for $${Number(
          ingestJson.amount || 0
        ).toFixed(2)}`
      );

      // Optional: let parent refresh expenses/budget
      if (onCreated) onCreated();

      // Reset file input
      setFile(null);
    } catch (e: any) {
      console.error(e);
      setMsg(e.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="font-medium mb-2">Upload Receipt</h3>
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm"
      />
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="mt-2 rounded bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "Processing..." : "Upload & Auto-Create Expense"}
      </button>
      {msg && <p className="mt-2 text-xs text-slate-600">{msg}</p>}
    </div>
  );
}
