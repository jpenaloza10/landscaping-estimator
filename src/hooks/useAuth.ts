// src/hooks/useAuth.ts

// Minimal auth "hook" used by EstimateWizard and other components.
// Right now it just reads a token from localStorage.
// Later you can replace this with a real AuthContext provider if you want.

export type AuthInfo = {
  token: string | null;
};

/**
 * useAuth
 *
 * For now:
 * - Looks for a JWT (or any token) in localStorage under "auth_token"
 * - Returns { token } so components can decide whether to show authenticated-only UI
 *
 * You can update the storage key to whatever your login flow uses.
 */
export function useAuth(): AuthInfo {
  // Avoid crashing during SSR / build where `window` is undefined
  if (typeof window === "undefined") {
    return { token: null };
  }

  // 🔑 Make sure this key matches whatever your login flow uses.
  const token = window.localStorage.getItem("auth_token");

  return { token };
}
