import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-text-secondary">Loading…</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.location?.lat) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
