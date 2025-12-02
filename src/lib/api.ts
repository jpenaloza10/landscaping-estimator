/* =========================
   Base URL
   ========================= */
const RAW_BASE = import.meta.env.VITE_API_URL as string | undefined;
const BASE_URL = RAW_BASE ? RAW_BASE.replace(/\/+$/, "") : undefined;
export const API = BASE_URL;

/* =========================
   Errors + Options
   ========================= */
export class ApiError extends Error {
  status: number;
  payload?: unknown;
  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function normalizePath(path: string): string {
  // Ensure leading slash
  let p = path.startsWith("/") ? path : `/${path}`;
  // Remove double slashes EXCEPT after "https://"
  return p.replace(/([^:]\/)\/+/g, "$1");
}

/* =========================
   Auth Token Management
   ========================= */
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("authToken", token);
  } else {
    localStorage.removeItem("authToken");
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!authToken) {
    authToken = localStorage.getItem("authToken");
  }
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

/* =========================
   Core JSON Fetch Wrapper
   ========================= */
export async function api<T = unknown>(
  path: string,
  { method = "GET", body, headers = {}, signal }: ApiOptions = {}
): Promise<T> {
  if (!BASE_URL) {
    throw new Error("VITE_API_URL is not set. Add it to your .env");
  }

  const cleanPath = normalizePath(path);
  const url = `${BASE_URL}${cleanPath}`;

  const authHeaders = await getAuthHeaders();

  const finalHeaders: HeadersInit = {
    Accept: "application/json",
    ...(body != null ? { "Content-Type": "application/json" } : {}),
    ...authHeaders,
    ...headers,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body != null ? JSON.stringify(body) : undefined,
      mode: "cors",
      credentials: "omit",
      signal,
    });
  } catch (err: any) {
    throw new ApiError(err?.message || "Network error", 0);
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const payload = isJson
    ? await res.json().catch(() => undefined)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const msg =
      (isJson && (payload as any)?.error) ||
      (typeof payload === "string" && payload.trim()) ||
      `HTTP ${res.status}`;

    throw new ApiError(msg, res.status, payload);
  }

  return (isJson ? (payload as T) : (payload as unknown as T));
}

/* =========================
   Raw fetch (non-JSON)
   ========================= */
export async function apiRaw(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  if (!BASE_URL) throw new Error("VITE_API_URL missing");

  const cleanPath = normalizePath(path);
  const url = `${BASE_URL}${cleanPath}`;

  const authHeaders = await getAuthHeaders();

  const res = await fetch(url, {
    mode: "cors",
    credentials: "omit",
    ...init,
    headers: {
      ...(init.headers || {}),
      ...authHeaders,
    },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const maybeJson = await res.clone().json();
      if (maybeJson?.error) message = maybeJson.error;
    } catch {}
    throw new ApiError(message, res.status);
  }

  return res;
}

/* =========================
   Auth
   ========================= */
export type SafeUser = { id: string | number; name: string; email: string };

export async function loginRequest(
  email: string,
  password: string
): Promise<{ token: string; user: SafeUser }> {
  return api("/api/auth/login", { method: "POST", body: { email, password } });
}

export async function registerRequest(
  name: string,
  email: string,
  password: string
): Promise<{ token: string; user: SafeUser }> {
  return api("/api/auth/signup", {
    method: "POST",
    body: { name, email, password },
  });
}

/* =========================
   Projects
   ========================= */
export interface Project {
  id: number;
  name: string;
  description?: string | null;
  location?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProjects(): Promise<Project[]> {
  const { projects } = await api<{ projects: Project[] }>("/api/projects");
  return projects;
}

export async function createProject(input: {
  name: string;
  description: string;
  location: string;
}): Promise<Project> {
  const { project } = await api<{ project: Project }>("/api/projects", {
    method: "POST",
    body: input,
  });
  return project;
}

/* =========================
   Dashboard
   ========================= */
export interface DashboardSummary {
  totalProjects: number;
  totalEstimates: number;
  totalEstimateValue: number;
  totalExpenses: number;
  totalApprovedChangeOrders: number;
  contractValue: number;
  grossProfit: number;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return api("/api/dashboard/summary");
}

export interface DashboardProjectFinancial {
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
}

export async function getDashboardProjectsFinancial(): Promise<{
  projects: DashboardProjectFinancial[];
}> {
  return api("/api/dashboard/projects");
}

/* =========================
   Assemblies + Estimates
   ========================= */
export async function listAssemblies() {
  return api("/api/assemblies");
}

export async function listTemplates() {
  return api("/api/assemblies/templates");
}

export async function createEstimate(payload: {
  projectId: number;
  location?: Record<string, unknown>;
  lines: Array<{ assemblyId: string; inputs: Record<string, number> }>;
}) {
  return api("/api/estimates", { method: "POST", body: payload });
}

export async function getEstimate(estimateId: string) {
  return api(`/api/estimates/${encodeURIComponent(estimateId)}`);
}

export async function listEstimates(projectId: number) {
  return api(`/api/projects/${projectId}/estimates`);
}

/* =========================
   FIXED finalizeEstimate()
   ========================= */
export async function finalizeEstimate(estimateId: string): Promise<void> {
  const path = normalizePath(
    `/api/estimates/${encodeURIComponent(estimateId)}/finalize`
  );

  return api(path, { method: "POST" });
}

/* =========================
   Proposal PDFs
   ========================= */
export function getProposalPdfUrl(estimateId: string): string {
  if (!BASE_URL) throw new Error("VITE_API_URL missing");
  return `${BASE_URL}/api/proposals/${encodeURIComponent(estimateId)}.pdf`;
}

export async function downloadProposalPdf(estimateId: string): Promise<Blob> {
  const res = await apiRaw(`/api/proposals/${encodeURIComponent(estimateId)}.pdf`);
  return res.blob();
}

/* =========================
   Expenses + Budget
   ========================= */
export async function getBudgetReport(projectId: number) {
  return api(`/api/reports/budget?projectId=${projectId}`);
}

export async function listExpenses(projectId: number) {
  return api(`/api/expenses?projectId=${projectId}`);
}

export async function createExpense(input: any) {
  return api("/api/expenses", {
    method: "POST",
    body: { ...input, currency: input.currency || "USD" },
  });
}

/* =========================
   Convenience alias
   ========================= */
export const authedFetch = api;
