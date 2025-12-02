import { API } from "./api";

/** Safely POST JSON with Authorization header */
async function postJSON(path: string, body: any, token: string) {
  if (!API) {
    throw new Error("VITE_API_URL is not set in your environment.");
  }

  // Ensure the path always begins with "/"
  const url = `${API}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message: string;
    try {
      message = await res.text();
    } catch {
      message = `Request failed: ${res.status}`;
    }
    throw new Error(message || `Request failed: ${res.status}`);
  }

  return res.json();
}

/** AI: Recommend assemblies based on estimate */
export function aiRecommendAssemblies(estimateId: string, token: string) {
  return postJSON("/api/ai/recommend-assemblies", { estimateId }, token);
}

/** AI: Proposal narrative text */
export function aiProposalText(
  estimateId: string,
  style: "simple" | "professional" | "sales",
  token: string
) {
  return postJSON("/api/ai/proposal-text", { estimateId, style }, token);
}

/** AI: Validate estimate (catch errors, risks, underpricing) */
export function aiValidateEstimate(estimateId: string, token: string) {
  return postJSON("/api/ai/validate-estimate", { estimateId }, token);
}

/** AI: Profit analysis (baseline vs expenses vs change orders) */
export function aiProfitAnalysis(estimateId: string, token: string) {
  return postJSON("/api/ai/profit-analysis", { estimateId }, token);
}
