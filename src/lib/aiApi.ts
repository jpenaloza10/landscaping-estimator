import { authedFetch } from "./api";

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  return authedFetch<T>(path, {
    method: "POST",
    body,
  });
}

export function aiRecommendAssemblies(estimateId: string) {
  return postJSON("/api/ai/recommend-assemblies", { estimateId });
}

export function aiProposalText(
  estimateId: string,
  style: "simple" | "professional" | "sales"
) {
  return postJSON("/api/ai/proposal-text", { estimateId, style });
}

export function aiValidateEstimate(estimateId: string) {
  return postJSON("/api/ai/validate-estimate", { estimateId });
}

export function aiProfitAnalysis(estimateId: string) {
  return postJSON("/api/ai/profit-analysis", { estimateId });
}
