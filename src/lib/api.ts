// src/lib/api.ts
import { supabase } from "./supabase"; 

const RAW_BASE = import.meta.env.VITE_API_URL as string | undefined;
const BASE_URL = RAW_BASE?.replace(/\/+$/, "");


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

// ⬇️ New helper: grab current Supabase access token
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  // (Optional) log once for debugging
  // console.log("api -> using supabase token?", Boolean(token), error);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T = unknown>(
  path: string,
  { method = "GET", body, headers = {}, signal }: ApiOptions = {}
): Promise<T> {
  if (!BASE_URL) {
    throw new Error("VITE_API_URL is not set. Add it to your .env and redeploy.");
  }

  const url = `${BASE_URL}${normalizePath(path)}`;

  // ⬇️ Merge Supabase token
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
  const payload = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => "");

  if (!res.ok) {
    const msg =
      (isJson && (payload as any)?.error) ||
      (typeof payload === "string" && payload.trim()) ||
      `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, payload);
  }

  return (isJson ? (payload as T) : (payload as unknown as T));
}

/** ========= Auth (backend endpoints) =========
 * If your backend still exposes /api/auth/login or /api/auth/signup and mints its
 * own JWT, you can keep these. But with Supabase Auth, you typically call supabase.auth
 * on the frontend instead, and your backend just verifies the Supabase JWT.
 */

export type SafeUser = { id: string | number; name: string; email: string };

// If you keep these routes, that's fine—just know your app now also sends Supabase JWTs.
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

/** ========= Projects ========= */

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

export const authedFetch = api;
