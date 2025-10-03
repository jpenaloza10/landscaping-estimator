// src/lib/api.ts
const BASE_URL = import.meta.env.VITE_API_URL;
export function getToken() {
    return localStorage.getItem("authToken");
}
export function setToken(token) {
    localStorage.setItem("authToken", token);
}
export function clearToken() {
    localStorage.removeItem("authToken");
}
export async function api(path, { method = "GET", body, headers = {} } = {}) {
    if (!BASE_URL) {
        throw new Error("VITE_API_URL is not set. Add it to your Vercel/Env and restart the dev server.");
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
        return (await res.json());
    }
    return (await res.text());
}
export async function loginRequest(email, password) {
    return api("/api/login", {
        method: "POST",
        body: { email, password },
    });
}
// Register
export async function registerRequest(email, password) {
    return api("/api/register", {
        method: "POST",
        body: { email, password },
    });
}
export async function getProjects() {
    return api("/api/projects");
}
// Create project (protected)
export async function createProject(input) {
    return api("/api/projects", {
        method: "POST",
        body: input,
    });
}
