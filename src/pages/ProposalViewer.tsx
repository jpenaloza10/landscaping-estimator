import { useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { getProposalPdfUrl } from "../lib/api";

export default function ProposalViewer() {
  const { estimateId } = useParams<{ estimateId: string }>();

  // Compute the PDF URL using the same helper used elsewhere
  const pdfUrl = useMemo(() => {
    if (!estimateId) return null;
    try {
      return getProposalPdfUrl(estimateId);
    } catch {
      return null;
    }
  }, [estimateId]);

  const [loading, setLoading] = useState(true);
  const [fileExists, setFileExists] = useState(true);

  useEffect(() => {
    async function checkPDF() {
      if (!pdfUrl) {
        setFileExists(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(pdfUrl, { method: "HEAD" });
        if (!res.ok) setFileExists(false);
      } catch {
        setFileExists(false);
      } finally {
        setLoading(false);
      }
    }

    if (estimateId) {
      void checkPDF();
    }
  }, [estimateId, pdfUrl]);

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

  if (loading) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Proposal</h2>
        <p className="text-sm">Loading proposal...</p>
      </section>
    );
  }

  if (!fileExists) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Proposal</h2>
        <p className="text-sm text-red-600">
          Unable to load proposal for estimate <strong>{estimateId}</strong>.
        </p>
        <p className="text-sm mt-2">
          Make sure your backend route <code>/api/proposals/:estimateId.pdf</code> is
          mounted and returning 200.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold mb-3">Proposal</h2>
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
