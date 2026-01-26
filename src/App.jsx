import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import Users from "./pages/Users/User";
import DashboardRouter from "./pages/DashboardRouter";
import RequireRole from "./routes/RequireRole";
import Admin from "./pages/roles/Admin/Index";
import Teacher from "./pages/roles/Teacher/Index";
import TeacherAttendance from "./pages/roles/Teacher/Attendance";
import Student from "./pages/roles/Student/Index";
import Panda from "./pages/roles/Panda/Index";
import Guest from "./pages/roles/Guest/Index";
import Owner from "./pages/roles/Owner/Index";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardRouter />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/users"
          element={
            <RequireRole roles={["owner", "admin", "panda"]}>
              <Users />
            </RequireRole>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole roles={["owner", "admin", "panda"]}>
              <Admin />
            </RequireRole>
          }
        />
        <Route
          path="/owner"
          element={
            <RequireRole roles={["owner"]}>
              <Owner />
            </RequireRole>
          }
        />
        <Route
          path="/teacher"
          element={
            <RequireRole roles={["owner", "teacher", "admin", "panda"]}>
              <Teacher />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <RequireRole roles={["owner", "teacher", "admin", "panda"]}>
              <TeacherAttendance />
            </RequireRole>
          }
        />
        <Route
          path="/student"
          element={
            <RequireRole roles={["owner", "student", "teacher", "admin", "panda"]}>
              <Student />
            </RequireRole>
          }
        />
        <Route
          path="/panda"
          element={
            <RequireRole roles={["panda"]}>
              <Panda />
            </RequireRole>
          }
        />
        <Route
          path="/guest"
          element={
            <RequireRole roles={["owner", "guest", "student", "teacher", "admin", "panda"]}>
              <Guest />
            </RequireRole>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
