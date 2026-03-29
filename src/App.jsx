import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import RequireRole from "./routes/RequireRole";

const DashboardRouter = lazy(() => import("./pages/DashboardRouter"));
const Login = lazy(() => import("./pages/Login/Login"));
const Register = lazy(() => import("./pages/Register/Register"));
const Admin = lazy(() => import("./pages/roles/Admin/Index"));
const Owner = lazy(() => import("./pages/roles/Owner/Index"));
const Panda = lazy(() => import("./pages/roles/Panda/Index"));
const Teacher = lazy(() => import("./pages/roles/Teacher/Index"));
const TeacherAttendance = lazy(() => import("./pages/roles/Teacher/Attendance"));
const Student = lazy(() => import("./pages/roles/Student/Index"));
const Guest = lazy(() => import("./pages/roles/Guest/Index"));
const UsersPage = lazy(() => import("./pages/Users/User"));

function RouteFallback() {
  return <div className="center-screen">Loading page...</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<DashboardRouter />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/users"
            element={(
              <RequireRole roles={["owner", "admin", "panda"]}>
                <UsersPage />
              </RequireRole>
            )}
          />
          <Route path="/admin" element={<RequireRole roles={["owner", "admin", "panda"]}><Admin /></RequireRole>} />
          <Route path="/owner" element={<RequireRole roles={["owner"]}><Owner /></RequireRole>} />
          <Route path="/panda" element={<RequireRole roles={["panda"]}><Panda /></RequireRole>} />
          <Route path="/teacher" element={<RequireRole roles={["teacher", "admin", "owner", "panda"]}><Teacher /></RequireRole>} />
          <Route path="/teacher/attendance" element={<RequireRole roles={["teacher", "admin", "owner", "panda"]}><TeacherAttendance /></RequireRole>} />
          <Route path="/student" element={<RequireRole roles={["student", "teacher", "admin", "owner", "panda"]}><Student /></RequireRole>} />
          <Route path="/guest" element={<RequireRole roles={["guest", "student", "teacher", "admin", "owner", "panda"]}><Guest /></RequireRole>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
