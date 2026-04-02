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
import ProjectDetail from "./pages/ProjectDetail";

// Sprint 2 pages
import EstimateWizard from "./pages/EstimateWizard";
import Assemblies from "./pages/Assemblies";
import Expenses from "./pages/Expenses";
import ProposalViewer from "./pages/ProposalViewer";

// Demo / sample pages (public — no auth required)
import SampleProjects  from "./pages/demo/SampleProjects";
import SampleEstimates from "./pages/demo/SampleEstimates";
import SampleExpenses  from "./pages/demo/SampleExpenses";

export function PublicLogin() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  return user ? <Navigate to="/projects" replace /> : <Home />;
}

const router = createBrowserRouter([
  // Landing
  { path: "/", element: <PublicLogin /> },

  // Public auth pages
  { path: "/signup", element: <SignUp /> },
  { path: "/login",  element: <Login /> },

  // Demo / preview pages — no auth required
  { path: "/demo/projects",  element: <SampleProjects /> },
  { path: "/demo/estimates", element: <SampleEstimates /> },
  { path: "/demo/expenses",  element: <SampleExpenses /> },

  // Protected app pages
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: "/dashboard",             element: <Dashboard /> },
      { path: "/projects",              element: <Projects /> },
      { path: "/projects/new",          element: <ProjectWizard /> },
      { path: "/projects/:id",          element: <ProjectDetail /> },
      { path: "/projectwizard",         element: <ProjectWizard /> }, // legacy alias
      { path: "/estimate",              element: <EstimateWizard /> },
      { path: "/assemblies",            element: <Assemblies /> },
      { path: "/expenses",              element: <Expenses /> },
      { path: "/proposals/:estimateId", element: <ProposalViewer /> },
      { path: "/account",              element: <Account /> },
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
