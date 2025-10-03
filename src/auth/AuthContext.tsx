import React, { createContext, useContext, useEffect, useState } from "react";
type User = { id: number; name: string; email: string } | null;
type Ctx = { user: User; token: string | null; setAuth: (t: string, u: User) => void; clearAuth: () => void; };
const AuthContext = createContext<Ctx>({ user: null, token: null, setAuth: () => {}, clearAuth: () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { const t = localStorage.getItem("token"); const u = localStorage.getItem("user");
    if (t && u) { setToken(t); setUser(JSON.parse(u)); } }, []);
  const setAuth = (t: string, u: User) => { setToken(t); setUser(u); localStorage.setItem("token", t); localStorage.setItem("user", JSON.stringify(u)); };
  const clearAuth = () => { setToken(null); setUser(null); localStorage.removeItem("token"); localStorage.removeItem("user"); };
  return <AuthContext.Provider value={{ user, token, setAuth, clearAuth }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
