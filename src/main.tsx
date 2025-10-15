import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";

import AppLayout from "./layouts/AppLayout";

export function PublicLogin() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  return user ? <Navigate to="/dashboard" replace /> : <Login />;
}

const router = createBrowserRouter([
  { path: "/", element: <PublicLogin /> },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/projects", element: <Projects /> },
      // { path: "/expenses", element: <Expenses /> },
      // { path: "/account", element: <Account /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

console.log("BOOT: main.tsx loaded ✅", import.meta.env.MODE, import.meta.env.PROD);


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
