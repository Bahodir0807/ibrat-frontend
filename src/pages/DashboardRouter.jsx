import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardRouter() {
  const { status, isAuthenticated, role } = useAuth();

  if (status === "loading") {
    return <div className="center-screen">Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === "owner") return <Navigate to="/owner" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "panda") return <Navigate to="/panda" replace />;
  if (role === "teacher") return <Navigate to="/teacher" replace />;
  if (role === "student") return <Navigate to="/student" replace />;
  return <Navigate to="/guest" replace />;
}
