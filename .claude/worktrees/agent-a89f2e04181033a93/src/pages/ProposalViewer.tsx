import { useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { getProposalPdfUrl, finalizeEstimate } from "../lib/api";

export default function ProposalViewer() {
  const { estimateId } = useParams<{ estimateId: string }>();

  const pdfUrl = useMemo(() => {
    if (!estimateId) return null;
    try {
      const url = getProposalPdfUrl(estimateId);
      console.log("[ProposalViewer] pdfUrl =", url);
      return url;
    } catch (err) {
      console.error("[ProposalViewer] getProposalPdfUrl failed:", err);
      return null;
    }
  }, [estimateId]);

  const [loading, setLoading] = useState(true);
  const [fileExists, setFileExists] = useState<boolean | null>(null);

  // 🔹 finalize button state
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeMessage, setFinalizeMessage] = useState<string | null>(null);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);

  useEffect(() => {
    async function checkPDF() {
      if (!pdfUrl) {
        setFileExists(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(pdfUrl, { method: "HEAD" });
        console.log("[ProposalViewer] HEAD status =", res.status);
        setFileExists(res.ok);
      } catch (err) {
        console.error("[ProposalViewer] HEAD failed:", err);
        setFileExists(false);
      } finally {
        setLoading(false);
      }
    }

    if (estimateId) {
      void checkPDF();
    }
  }, [estimateId, pdfUrl]);

  async function handleFinalize() {
    if (!estimateId) return;
    setFinalizing(true);
    setFinalizeMessage(null);
    setFinalizeError(null);

    try {
      await finalizeEstimate(estimateId);
      setFinalizeMessage(
        "Estimate finalized and baseline created. You can now see it on the Expenses page."
      );
    } catch (err: any) {
      console.error("[ProposalViewer] finalize error:", err);
      setFinalizeError(
        err?.message || "Failed to finalize estimate. Check console/network tab."
      );
    } finally {
      setFinalizing(false);
    }
  }

  if (!estimateId) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Proposal</h2>
        <p className="text-red-600 text-sm">No estimate ID provided.</p>
      </section>
    );
  }

  if (!pdfUrl) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Proposal</h2>
        <p className="text-sm text-red-600">
          Proposal URL is not configured. Check your <code>VITE_API_URL</code> env
          and <code>getProposalPdfUrl</code> helper.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold mb-3">Proposal</h2>

      {/* 🔹 Finalize estimate / create baseline */}
      <div className="mb-3 flex flex-col gap-1 text-sm">
        <button
          type="button"
          onClick={handleFinalize}
          disabled={finalizing}
          className="inline-flex items-center justify-center px-3 py-2 rounded bg-slate-900 text-white disabled:opacity-60"
        >
          {finalizing ? "Finalizing…" : "Finalize Estimate (Create Baseline)"}
        </button>
        {finalizeMessage && (
          <p className="text-green-600 text-xs">{finalizeMessage}</p>
        )}
        {finalizeError && (
          <p className="text-red-600 text-xs">{finalizeError}</p>
        )}
      </div>

      {loading && (
        <p className="text-sm mb-2">Checking if proposal exists…</p>
      )}

      {fileExists === false && !loading && (
        <p className="text-sm text-red-600 mb-2">
          HEAD request failed for <code>{pdfUrl}</code>. The iframe below may still
          show more details in the browser dev tools (Network tab).
        </p>
      )}

      <div className="h-[80vh] border rounded overflow-hidden">
        <iframe title="proposal" src={pdfUrl} className="w-full h-full" />
      </div>

      <div className="mt-2 text-sm">
        Can’t see it?{" "}
        <a className="underline" href={pdfUrl} target="_blank" rel="noreferrer">
          Open in a new tab
        </a>.
      </div>
    </section>
  );
}
