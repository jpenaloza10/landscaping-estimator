import { useState } from "react";
import { downloadProposalPdf, getProposalPdfUrl } from "../lib/api";

type Props = {
  estimateId: string;
  filename?: string; 
};

export default function DownloadPdfButton({ estimateId, filename }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleDownload() {
    setLoading(true);
    setErr("");
    try {
      const blob = await downloadProposalPdf(estimateId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `proposal-${estimateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message || "Failed to download PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="rounded bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-50"
        title="Download proposal as PDF"
      >
        {loading ? "Downloading…" : "Download PDF"}
      </button>

      {/* Optional: direct open link as a fallback */}
      <a
        href={getProposalPdfUrl(estimateId)}
        target="_blank"
        rel="noreferrer"
        className="text-sm underline text-slate-600 hover:text-slate-800"
        title="Open PDF in new tab"
      >
        Open in new tab
      </a>

      {err && <span className="text-sm text-red-600">{err}</span>}
    </div>
  );
}
