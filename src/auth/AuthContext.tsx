// src/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export type AuthCtx = {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;

  // legacy helpers expected by your pages (kept for compatibility)
  setAuth: (session: Session | null) => void;
  clearAuth: () => Promise<void>;

  // primary actions (now return structured results)
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // compute token from session
  const token = session?.access_token ?? null;

  useEffect(() => {
    let mounted = true;

    (async () => {
      // 1) fetch existing session on mount
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        console.warn("supabase.auth.getSession error:", error.message);
      }
      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setLoading(false);
    })();

    // 2) subscribe to auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // legacy helpers (kept)
  function setAuth(next: Session | null) {
    setSession(next);
    setUser(next?.user ?? null);
  }

  async function clearAuth() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }

  // main actions (return objects so UI can show messages gracefully)
  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    // success: session is present
    setAuth(data.session);
    return {};
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { error: error.message };
    }
    // If confirm-email is enabled, Supabase returns a user but no session until they confirm.
    const needsConfirm = !!data?.user && !data?.session;
    if (data.session) setAuth(data.session);
    return { needsConfirm };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      session,
      token,
      loading,
      setAuth,
      clearAuth,
      signIn,
      signUp,
      signOut,
    }),
    [user, session, token, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
