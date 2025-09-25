const BASE_URL = import.meta.env.VITE_API_URL;

// Read/Write Token
export function getToken() {
    return localStorage.getItem("authToken");
}

export function setToken(token) {
    localStorage.setItem("authToken", token);
}

export function clearToken() {
    localStorage.removeItem("authToken");
}

// Generic request wrapper
export async function api(path, { method = "GET", body, headers = {} } = {}) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
    }

    return res.json();
}

// Specific login request
export async function loginRequest(email, password) {
    return api("/api/login", {
        method: "POST",
        body: { email, password },
    });
}