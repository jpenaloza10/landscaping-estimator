import { API } from "./api";

async function getJSON(path: string, token: string) {
  const res = await fetch(`${API}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export type DashboardSummary = {
  totalProjects: number;
  totalEstimates: number;
  totalEstimateValue: number;
  totalExpenses: number;
  totalApprovedChangeOrders: number;
  contractValue: number;
  grossProfit: number;
};

export type DashboardProjectRow = {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  created_at: string;
  estimatesTotal: number;
  expensesTotal: number;
  approvedChangeOrdersTotal: number;
  contractValue: number;
  grossProfit: number;
};

export async function getDashboardSummary(
  token: string
): Promise<DashboardSummary> {
  return getJSON("/api/dashboard/summary", token);
}

export async function getDashboardProjects(
  token: string
): Promise<{ projects: DashboardProjectRow[] }> {
  return getJSON("/api/dashboard/projects", token);
}
