import { Navigate } from "react-router-dom";

export default function RequireRole({ roles, children }) {
  const token = localStorage.getItem("token");
  const role = String(localStorage.getItem("role") || "").toLowerCase();
  if (!token) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to="/" replace />;
  return children;
}
