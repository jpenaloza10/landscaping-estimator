// src/lib/api.ts
const BASE_URL = import.meta.env.VITE_API_URL as string | undefined;

export function getToken(): string | null {
  return localStorage.getItem("authToken");
}
export function setToken(token: string): void {
  localStorage.setItem("authToken", token);
}
export function clearToken(): void {
  localStorage.removeItem("authToken");
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
    throw new Error(
      "VITE_API_URL is not set. Add it to your Vercel/Env and restart the dev server."
    );
  }

  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

export async function loginRequest(
  email: string,
  password: string
): Promise<{ token: string }> {
  return api<{ token: string }>("/api/login", {
    method: "POST",
    body: { email, password },
  });
}


// Register
export async function registerRequest(
  email: string,
  password: string
): Promise<{ message: string }> {
  return api<{ message: string }>("/api/register", {
    method: "POST",
    body: { email, password },
  });
}

// List projects (protected)
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  createdAt: string;
  updatedAt: string;
}
export async function getProjects(): Promise<Project[]> {
  return api<Project[]>("/api/projects");
}

// Create project (protected)
export async function createProject(input: {
  name: string;
  description?: string;
  location?: string;
}): Promise<Project> {
  return api<Project>("/api/projects", {
    method: "POST",
    body: input,
  });
}
