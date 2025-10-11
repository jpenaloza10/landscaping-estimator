import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
// If you created Projects page earlier, import it; otherwise remove this line/route.
import Projects from "./pages/Projects";

// Auth context + guard
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";

const router = createBrowserRouter([
  // Public
  { path: "/", element: <Login /> },

  // Protected routes
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
  },
  // Optional protected route if you added Projects page
  {
    path: "/projects",
    element: (
      <RequireAuth>
        <Projects />
      </RequireAuth>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
