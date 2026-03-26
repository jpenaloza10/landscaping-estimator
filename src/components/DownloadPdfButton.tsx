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
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to download PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-3">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="font-sans text-[11px] font-semibold tracking-widest uppercase text-brand-cream-dim underline underline-offset-2 hover:text-brand-orange transition-colors disabled:opacity-40"
        title="Download proposal as PDF"
      >
        {loading ? "Downloading…" : "Download PDF"}
      </button>
      {err && <span className="font-sans text-xs text-brand-orange">{err}</span>}
    </div>
  );
}
