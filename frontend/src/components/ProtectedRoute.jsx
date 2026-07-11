import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  adminOnly = false,
  deliveryOnly = false,
}) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="page-loader">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin pages
  if (adminOnly && !user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  // Delivery pages
  if (deliveryOnly && !user?.is_delivery_man) {
    return <Navigate to="/" replace />;
  }

  return children;
}
