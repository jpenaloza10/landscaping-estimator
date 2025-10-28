// src/lib/api.ts
import { supabase } from "./supabase";

/* =========================
   Base URL
   ========================= */
const RAW_BASE = import.meta.env.VITE_API_URL as string | undefined;
// strip trailing slashes
const BASE_URL = RAW_BASE ? RAW_BASE.replace(/\/+$/, "") : undefined;

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

/** Ensure all paths start with a leading slash */
function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/* =========================
   Auth header (Supabase)
   ========================= */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* =========================
   Core fetch (JSON by default)
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
   Optional: raw fetch helper (non-JSON)
   ========================= */
async function apiRaw(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
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
    } catch {
      // ignore json parse error; keep default message
    }
    throw new ApiError(message, res.status);
  }
  return res;
}

/* =========================
   Auth (optional backend JWT)
   ========================= */
export type SafeUser = { id: string | number; name: string; email: string };

export async function loginRequest(
  email: string,
  password: string
): Promise<{ token: string; user: SafeUser }> {
  return api("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
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
  id: string;
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
   Sprint 2: Estimation Core
   ========================= */

/** ---- Types (align with backend Prisma/API) ---- */
export interface AssemblyItem {
  id: string;
  assemblyId: string;
  name: string;
  unit: string;             // e.g., "pallet", "ton", "hr"
  unitCost: number;         // numeric
  qtyFormula: string;       // e.g., "area/100"
}

export interface Assembly {
  id: string;
  slug: string;
  name: string;
  trade: string;            // e.g., "Hardscape"
  unit: string;             // e.g., "sqft"
  wastePct: number;         // 0.07 for 7%
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
  projectId: string;
  subtotal: number;
  tax: number;
  total: number;
  location?: Record<string, unknown> | null; // { zip, state, ... }
  lines: EstimateLine[];
  createdAt: string;
  updatedAt: string;
}

/** ---- Assemblies / Templates ---- */
export async function listAssemblies(): Promise<Assembly[]> {
  return api<Assembly[]>("/api/assemblies");
}

export async function listTemplates(): Promise<Template[]> {
  return api<Template[]>("/api/assemblies/templates");
}

/** ---- Estimates ----
 * createEstimate: server computes takeoff, tax, totals
 */
export async function createEstimate(payload: {
  projectId: string;
  location?: Record<string, unknown>;
  lines: Array<{ assemblyId: string; inputs: Record<string, number> }>;
}): Promise<Estimate> {
  return api<Estimate>("/api/estimates", {
    method: "POST",
    body: payload,
  });
}

/** Get a single estimate by id */
export async function getEstimate(estimateId: string): Promise<Estimate> {
  return api<Estimate>(`/api/estimates/${encodeURIComponent(estimateId)}`);
}

/** List all estimates for a project (if your API supports it) */
export async function listEstimates(projectId: string): Promise<Estimate[]> {
  return api<Estimate[]>(`/api/projects/${encodeURIComponent(projectId)}/estimates`);
}

/** ---- Proposal PDF helpers ----
 * Link usage:
 *   <a href={getProposalPdfUrl(id)} target="_blank" rel="noreferrer">Open PDF</a>
 * Programmatic download:
 *   const blob = await downloadProposalPdf(id); // then createObjectURL(blob)
 */
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
   Convenience alias
   ========================= */
export const authedFetch = api;
