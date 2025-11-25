// src/auth/AuthContext.tsx
import React,
{
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loginRequest,
  registerRequest,
  setAuthToken,
  type SafeUser,
} from "../lib/api";

export type AuthCtx = {
  user: SafeUser | null;
  token: string | null;
  loading: boolean;

  // Legacy compatibility (these no longer use Supabase)
  setAuth: (token: string | null, user: SafeUser | null) => void;
  clearAuth: () => Promise<void>;

  // Primary actions
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     Load saved token on mount
     ========================= */
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUser");

    if (storedToken) {
      setTokenState(storedToken);
      setAuthToken(storedToken);
    }

    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("authUser");
      }
    }

    setLoading(false);
  }, []);

  /* =========================
     Helpers
     ========================= */
  function setAuth(nextToken: string | null, nextUser: SafeUser | null) {
    setTokenState(nextToken);
    setUserState(nextUser);

    setAuthToken(nextToken);

    if (nextToken) {
      localStorage.setItem("authToken", nextToken);
      localStorage.setItem("authUser", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    }
  }

  async function clearAuth() {
    setAuth(null, null);
  }

  /* =========================
     Main login
     ========================= */
  async function signIn(email: string, password: string) {
    try {
      const { token, user } = await loginRequest(email, password);

      setAuth(token, user);
      return {};
    } catch (err: any) {
      return { error: err?.message ?? "Login failed" };
    }
  }

  /* =========================
     Sign up
     ========================= */
  async function signUp(email: string, password: string) {
    try {
      // Use email prefix as a fallback "name"
      const nameFromEmail = email.split("@")[0] || email;
      const { token, user } = await registerRequest(
        nameFromEmail,
        email,
        password
      );

      if (token) setAuth(token, user);

      // No email-confirm flow here (backend could add it later)
      return { needsConfirm: false };
    } catch (err: any) {
      return { error: err?.message ?? "Signup failed" };
    }
  }

  /* =========================
     Logout
     ========================= */
  async function signOut() {
    clearAuth();
  }

  /* =========================
     Context value
     ========================= */
  const value = useMemo<AuthCtx>(
    () => ({
      user,
      token,
      loading,
      setAuth,
      clearAuth,
      signIn,
      signUp,
      signOut,
    }),
    [user, token, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
