// src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";

export type User = { id: string | number; name: string; email: string };

type Ctx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  setAuth: (next: { user: User | null; token: string | null }) => void;
  logout: () => void;      // primary name
  clearAuth: () => void;   // alias to match AppShell usage
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Hydrate from localStorage
    try {
      const t = localStorage.getItem("token");
      const u = localStorage.getItem("user");
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));
    } catch {}
    setLoading(false);
  }, []);

  const setAuth: Ctx["setAuth"] = ({ user, token }) => {
    setUser(user);
    setToken(token);
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  };

  const logout = () => setAuth({ user: null, token: null });
  const clearAuth = logout; // keep App.tsx unchanged

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, logout, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
