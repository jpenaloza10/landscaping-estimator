import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  // While we hydrate auth state from localStorage, avoid flashing
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!token) {
    // redirect to login and remember where we were trying to go
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
