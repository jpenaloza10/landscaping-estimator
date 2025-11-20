import { API } from "./api";

async function postJSON(path: string, body: any, token: string) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function aiRecommendAssemblies(estimateId: string, token: string) {
  return postJSON("/api/ai/recommend-assemblies", { estimateId }, token);
}

export function aiProposalText(
  estimateId: string,
  style: "simple" | "professional" | "sales",
  token: string
) {
  return postJSON("/api/ai/proposal-text", { estimateId, style }, token);
}

export function aiValidateEstimate(estimateId: string, token: string) {
  return postJSON("/api/ai/validate-estimate", { estimateId }, token);
}

export function aiProfitAnalysis(estimateId: string, token: string) {
  return postJSON("/api/ai/profit-analysis", { estimateId }, token);
}
