import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Account from "./pages/Account";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";

import AppLayout from "./layouts/AppLayout";
import ProjectWizard from "./pages/ProjectWizard";

export function PublicLogin() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  return user ? <Navigate to="/dashboard" replace /> : <Home />;
}

const router = createBrowserRouter([
  { path: "/", element: <PublicLogin /> },
  { path: "/signup", element: <SignUp />},
  { path: "/login", element: <Login />},
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/projects", element: <Projects /> },
      { path: "/projectwizard", element: <ProjectWizard /> },
      { path: "/account", element: <Account /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
