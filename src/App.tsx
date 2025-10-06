import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import type { ReactNode } from "react";           
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Projects from "./pages/Projects";
import ProjectWizard from "./pages/ProjectWizard";
import { useAuth } from "./auth/AuthContext";

export default function App() {
  const { user, clearAuth } = useAuth();

  return (
    <BrowserRouter>
      <nav className="p-4 bg-white shadow flex justify-between">
        <Link to="/" className="font-bold text-green-700">Landscaping Estimator</Link>
        <div className="space-x-3">
          {!user ? (
            <>
              <Link to="/login" className="text-green-700">Login</Link>
              <Link to="/signup" className="text-green-700">Sign Up</Link>
            </>
          ) : (
            <>
              <Link to="/projects" className="text-green-700">Projects</Link>
              <button onClick={clearAuth} className="text-red-600">Logout</button>
            </>
          )}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/projects" /> : <Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/projects" element={<RequireAuth><Projects /></RequireAuth>} />
        <Route path="/projects/new" element={<RequireAuth><ProjectWizard /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {   
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;                                       
}
