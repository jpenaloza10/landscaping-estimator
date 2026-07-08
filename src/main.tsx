import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";

// Home stays eagerly loaded — it's the landing page and must render instantly.
import Home from "./pages/Home";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { RequireAuth } from "./auth/RequireAuth";

// Everything else is lazy-loaded: each page becomes its own chunk,
// fetched only when the user navigates to it. This keeps the landing
// page bundle small and fast.
const Login          = lazy(() => import("./pages/Login"));
const SignUp         = lazy(() => import("./pages/SignUp"));
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const Projects       = lazy(() => import("./pages/Projects"));
const Account        = lazy(() => import("./pages/Account"));
const AppLayout      = lazy(() => import("./layouts/AppLayout"));
const ProjectWizard  = lazy(() => import("./pages/ProjectWizard"));
const ProjectDetail  = lazy(() => import("./pages/ProjectDetail"));

// Sprint 2 pages
const EstimateWizard = lazy(() => import("./pages/EstimateWizard"));
const EstimatesList  = lazy(() => import("./pages/EstimatesList"));
const Assemblies     = lazy(() => import("./pages/Assemblies"));
const Categories     = lazy(() => import("./pages/Categories"));
const Pricing        = lazy(() => import("./pages/Pricing"));
const Expenses       = lazy(() => import("./pages/Expenses"));
const ProposalViewer = lazy(() => import("./pages/ProposalViewer"));

// Demo / sample pages (public — no auth required)
const SampleProjects  = lazy(() => import("./pages/demo/SampleProjects"));
const SampleEstimates = lazy(() => import("./pages/demo/SampleEstimates"));
const SampleExpenses  = lazy(() => import("./pages/demo/SampleExpenses"));

function PageFallback() {
  return <div style={{ padding: 16 }}>Loading…</div>;
}

export function PublicLogin() {
  const { user, loading } = useAuth();
  if (loading) return <PageFallback />;
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
      { path: "/estimates",             element: <EstimatesList /> },
      { path: "/assemblies",            element: <Assemblies /> },  // legacy alias
      { path: "/categories",            element: <Categories /> },
      { path: "/pricing",               element: <Pricing /> },
      { path: "/expenses",              element: <Expenses /> },
      { path: "/proposals/:estimateId", element: <ProposalViewer /> },
      { path: "/account",              element: <Account /> },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);
