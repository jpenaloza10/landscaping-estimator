// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import "./index.css";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";

// Auth context + guard
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";

// Layout
import AppLayout from "./layouts/AppLayout";

/**
 * Public login route:
 * - shows Login when logged out
 * - redirects to /dashboard when logged in
 */
function PublicLogin() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-4 text-sm text-slate-500">Loading…</div>;
  return user ? <Navigate to="/dashboard" replace /> : <Login />;
}

/**
 * Wrapper for all protected pages:
 * - requires auth
 * - wraps children in the shared responsive AppLayout
 * - uses <Outlet /> so nested routes render inside AppLayout
 */
function ProtectedLayout() {
  return (
    <RequireAuth>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </RequireAuth>
  );
}

const router = createBrowserRouter([
  // Public route
  { path: "/", element: <PublicLogin /> },

  // Protected, shared layout
  {
    element: <ProtectedLayout />,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/projects", element: <Projects /> },
      // add as you build:
      // { path: "/expenses", element: <Expenses /> },
      // { path: "/account", element: <Account /> },
    ],
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
