import { useParams } from "react-router-dom";

export default function ProposalViewer() {
  const { estimateId } = useParams();
  const API = import.meta.env.VITE_API_BASE_URL;
  const pdfUrl = `${API}/api/proposals/${estimateId}.pdf`;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold mb-3">Proposal</h2>
      <iframe title="proposal" src={pdfUrl} className="w-full h-[80vh] border rounded"></iframe>
      <div className="mt-2 text-sm">
        Can’t see it? <a className="underline" href={pdfUrl} target="_blank" rel="noreferrer">Open in a new tab</a>.
      </div>
    </section>
  );
}
