import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div className="page-loader">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !user?.is_admin) return <Navigate to="/" replace />;

  return children;
}
