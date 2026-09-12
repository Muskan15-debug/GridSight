import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import Navbar from "../common/Navbar";

export default function ProtectedRoute({ children }) {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen label="Loading…" />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.location?.lat) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
    </div>
  );
}
