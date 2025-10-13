// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";

// Auth context + guard
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";

function PublicLogin() {
  const { user, loading } = useAuth();
  if (loading) return null; // or a spinner
  return user ? <Navigate to="/dashboard" replace /> : <Login />;
}

const router = createBrowserRouter([
  // Public
  { path: "/", element: <PublicLogin /> },

  // Protected
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/projects",
    element: (
      <RequireAuth>
        <Projects />
      </RequireAuth>
    ),
  },

  // Catch-all
  { path: "*", element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
