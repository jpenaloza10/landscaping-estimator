// src/lib/api.ts
const BASE_URL = import.meta.env.VITE_API_URL as string | undefined;

export function getToken(): string | null {
  return localStorage.getItem("token"); // standardized key
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
}

export async function api<T = unknown>(
  path: string,
  { method = "GET", body, headers = {} }: ApiOptions = {}
): Promise<T> {
  if (!BASE_URL) {
    throw new Error("VITE_API_URL is not set. Add it to your .env and restart the dev server.");
  }

  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body != null ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  // Try to parse JSON error bodies
  const contentType = res.headers.get("content-type") || "";
  const parseJson = async () => (contentType.includes("application/json") ? await res.json() : undefined);

  if (!res.ok) {
    const errBody = await parseJson();
    const msg = (errBody as any)?.error || (await res.text()).trim() || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const data = await parseJson();
  return (data ?? (await res.text())) as T;
}

// -------- Auth --------

export type SafeUser = { id: number; name: string; email: string };

export async function loginRequest(
  email: string,
  password: string
): Promise<{ token: string; user: SafeUser }> {
  return api<{ token: string; user: SafeUser }>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function registerRequest(
  name: string,
  email: string,
  password: string
): Promise<{ token: string; user: SafeUser }> {
  return api<{ token: string; user: SafeUser }>("/api/auth/signup", {
    method: "POST",
    body: { name, email, password },
  });
}

// -------- Projects --------

export interface Project {
  id: number;
  name: string;
  description: string;     // backend requires it on create
  location: string;        // backend requires it on create
  created_at: string;      // ISO strings from backend
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
