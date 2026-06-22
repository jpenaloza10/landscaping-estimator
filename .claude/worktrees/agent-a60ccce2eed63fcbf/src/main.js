import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
const router = createBrowserRouter([
    { path: "/", element: _jsx(Login, {}) },
    { path: "/dashboard", element: _jsx(Dashboard, {}) },
]);
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(RouterProvider, { router: router }) }));
