import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireRole({ roles, children }) {
  const { status, isAuthenticated, role } = useAuth();

  if (status === "loading") {
    return <div className="center-screen">Loading access rules…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
