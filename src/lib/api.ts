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
  return path.startsWith("/") ? path : `/${path}`;
}

/* =========================
   Auth Token Management (Option B)
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
  // Lazy load from localStorage if needed
  if (!authToken) {
    authToken = localStorage.getItem("authToken");
  }
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

/* =========================
   Core fetch (JSON)
   ========================= */
export async function api<T = unknown>(
  path: string,
  { method = "GET", body, headers = {}, signal }: ApiOptions = {}
): Promise<T> {
  if (!BASE_URL) {
    throw new Error("VITE_API_URL is not set. Add it to your .env and redeploy.");
  }

  const url = `${BASE_URL}${normalizePath(path)}`;
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
   Raw fetch helper
   ========================= */
export async function apiRaw(path: string, init: RequestInit = {}): Promise<Response> {
  if (!BASE_URL) {
    throw new Error("VITE_API_URL is not set. Add it to your .env and redeploy.");
  }

  const url = `${BASE_URL}${normalizePath(path)}`;
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
   Dashboard / Reporting
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
  return api<DashboardSummary>("/api/dashboard/summary");
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
  return api<{ projects: DashboardProjectFinancial[] }>("/api/dashboard/projects");
}

/* =========================
   Sprint 2: Estimation Core
   ========================= */
export interface AssemblyItem {
  id: string;
  assemblyId: string;
  name: string;
  unit: string;
  unitCost: number;
  qtyFormula: string;
}

export interface Assembly {
  id: string;
  slug: string;
  name: string;
  trade: string;
  unit: string;
  wastePct: number;
  items: AssemblyItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateLine {
  id: string;
  templateId: string;
  assemblyId: string;
  defaults?: Record<string, unknown> | null;
}

export interface Template {
  id: string;
  name: string;
  description?: string | null;
  lines: TemplateLine[];
  createdAt: string;
  updatedAt: string;
}

export interface EstimateItem {
  name: string;
  unit: string;
  unitCost: number;
  qty: number;
  extended: number;
  provider?: string;
  source?: string;
}

export interface EstimateLine {
  id: string;
  estimateId: string;
  assemblyId: string;
  inputs: Record<string, number>;
  items: EstimateItem[];
  lineTotal: number;
  notes?: string | null;
}

export interface Estimate {
  id: string;
  projectId: number;
  subtotal: number;
  tax: number;
  total: number;
  location?: Record<string, unknown> | null;
  lines: EstimateLine[];
  createdAt: string;
  updatedAt: string;
}

export async function listAssemblies(): Promise<Assembly[]> {
  return api<Assembly[]>("/api/assemblies");
}

export async function listTemplates(): Promise<Template[]> {
  return api<Template[]>("/api/assemblies/templates");
}

export async function createEstimate(payload: {
  projectId: number;
  location?: Record<string, unknown>;
  lines: Array<{ assemblyId: string; inputs: Record<string, number> }>;
}): Promise<Estimate> {
  return api<Estimate>("/api/estimates", { method: "POST", body: payload });
}

export async function getEstimate(estimateId: string): Promise<Estimate> {
  return api<Estimate>(`/api/estimates/${encodeURIComponent(estimateId)}`);
}

export async function listEstimates(projectId: number): Promise<Estimate[]> {
  return api<Estimate[]>(`/api/projects/${projectId}/estimates`);
}

export async function finalizeEstimate(estimateId: string): Promise<void> {
  await api(`/api/estimates/${encodeURIComponent(estimateId)}//finalize`, {
    method: "POST",
  });
}

export function getProposalPdfUrl(estimateId: string): string {
  if (!BASE_URL) throw new Error("VITE_API_URL is not set.");
  return `${BASE_URL}/api/proposals/${encodeURIComponent(estimateId)}.pdf`;
}

export async function downloadProposalPdf(estimateId: string): Promise<Blob> {
  const res = await apiRaw(`/api/proposals/${encodeURIComponent(estimateId)}.pdf`, {
    method: "GET",
  });
  return res.blob();
}

/* =========================
   Sprint 4–5: Expense Tracking
   ========================= */
export type ExpenseCategory =
  | "MATERIAL"
  | "LABOR"
  | "EQUIPMENT"
  | "SUBCONTRACTOR"
  | "OTHER";

export interface Expense {
  id: string;
  projectId: number;
  estimateId?: string | null;
  estimateLineId?: string | null;
  category: ExpenseCategory;
  vendor?: string | null;
  description?: string | null;
  amount: number;
  currency: string;
  date: string;
  receiptUrl?: string | null;
  meta?: Record<string, unknown> | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetReport {
  hasBaseline: boolean;
  baselineTotal: number;
  byCategory: Record<ExpenseCategory, number>;
  actualByCategory: Record<ExpenseCategory, number>;
  remainingByCategory: Record<ExpenseCategory, number>;
  totalActual: number;
  totalRemaining: number;
}

export async function getBudgetReport(projectId: number): Promise<BudgetReport> {
  return api<BudgetReport>(`/api/reports/budget?projectId=${projectId}`);
}

export async function listExpenses(projectId: number): Promise<Expense[]> {
  return api<Expense[]>(`/api/expenses?projectId=${projectId}`);
}

export async function createExpense(input: {
  projectId: number;
  estimateId?: string;
  estimateLineId?: string;
  category: ExpenseCategory | string;
  vendor?: string;
  description?: string;
  amount: number;
  currency?: string;
  date: string;
  receiptUrl?: string;
  meta?: Record<string, unknown>;
}): Promise<Expense> {
  return api<Expense>("/api/expenses", {
    method: "POST",
    body: { ...input, currency: input.currency || "USD" },
  });
}

/* =========================
   Convenience alias
   ========================= */
export const authedFetch = api;
