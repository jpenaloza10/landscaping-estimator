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

export function getToken(): string | null {
  return localStorage.getItem("token");
}
export function setToken(token: string): void {
  localStorage.setItem("token", token);
}
export function clearToken(): void {
  localStorage.removeItem("token");
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

export async function api<T = unknown>(
  path: string,
  { method = "GET", body, headers = {}, signal }: ApiOptions = {}
): Promise<T> {
  if (!BASE_URL) {
    throw new Error("VITE_API_URL is not set. Add it to your .env and redeploy.");
  }

  const token = getToken();
  const url = `${BASE_URL}${normalizePath(path)}`;

  const finalHeaders: HeadersInit = {
    Accept: "application/json",
    ...(body != null ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    // Network error, DNS, CORS block, etc.
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

// -------- Auth --------

export type SafeUser = { id: number; name: string; email: string };

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

// -------- Projects --------

export interface Project {
  id: number;
  name: string;
  description: string;
  location: string;
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
