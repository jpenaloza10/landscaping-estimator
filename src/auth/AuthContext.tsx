// src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export type AuthCtx = {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  // legacy helpers expected by your pages
  setAuth: (session: Session | null) => void;
  clearAuth: () => Promise<void>;
  // primary actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // computed
  const token = session?.access_token ?? null;

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }
    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // legacy helpers (used in your code)
  function setAuth(next: Session | null) {
    setSession(next);
    setUser(next?.user ?? null);
  }

  async function clearAuth() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }

  // main actions
  async function signIn(email: string, password: string) {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setAuth(data.session);
  }

  async function signUp(email: string, password: string) {
    const { error, data } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // Depending on Supabase email confirmation settings, session may be null here.
    if (data.session) setAuth(data.session);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }

  const value: AuthCtx = { user, session, token, loading, setAuth, clearAuth, signIn, signUp, signOut };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
