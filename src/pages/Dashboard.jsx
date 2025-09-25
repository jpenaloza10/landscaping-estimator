import React from "react";
import { useNavigate } from "react-router-dom";
import { getToken, clearToken } from "../lib/api";

export default function Dashboard() {
  const nav = useNavigate();
  const token = getToken();

  if (!token) {
    nav("/");
    return null;
  }

  function logout() {
    clearToken();
    nav("/");
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <button
            onClick={logout}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          >
            Logout
          </button>
        </div>
        <p className="mt-4 text-gray-700">
          You are logged in. Token stored in localStorage.
        </p>
      </div>
    </div>
  );
}
