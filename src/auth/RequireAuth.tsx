import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show a minimal loading state while auth session is resolving
  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  // Not authenticated → bounce to login, but remember where we came from
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Authenticated → render the protected content
  return <>{children}</>;
}
