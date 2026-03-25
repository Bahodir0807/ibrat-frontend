import { BrowserRouter, Route, Routes } from "react-router-dom";
import DashboardRouter from "./pages/DashboardRouter";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import RequireRole from "./routes/RequireRole";
import Admin from "./pages/roles/Admin/Index";
import Owner from "./pages/roles/Owner/Index";
import Panda from "./pages/roles/Panda/Index";
import Teacher from "./pages/roles/Teacher/Index";
import TeacherAttendance from "./pages/roles/Teacher/Attendance";
import Student from "./pages/roles/Student/Index";
import Guest from "./pages/roles/Guest/Index";
import UsersPage from "./pages/Users/User";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardRouter />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/users"
          element={
            <RequireRole roles={["owner", "admin", "panda"]}>
              <UsersPage />
            </RequireRole>
          }
        />
        <Route path="/admin" element={<RequireRole roles={["owner", "admin", "panda"]}><Admin /></RequireRole>} />
        <Route path="/owner" element={<RequireRole roles={["owner"]}><Owner /></RequireRole>} />
        <Route path="/panda" element={<RequireRole roles={["panda"]}><Panda /></RequireRole>} />
        <Route path="/teacher" element={<RequireRole roles={["teacher", "admin", "owner", "panda"]}><Teacher /></RequireRole>} />
        <Route path="/teacher/attendance" element={<RequireRole roles={["teacher", "admin", "owner", "panda"]}><TeacherAttendance /></RequireRole>} />
        <Route path="/student" element={<RequireRole roles={["student", "teacher", "admin", "owner", "panda"]}><Student /></RequireRole>} />
        <Route path="/guest" element={<RequireRole roles={["guest", "student", "teacher", "admin", "owner", "panda"]}><Guest /></RequireRole>} />
      </Routes>
    </BrowserRouter>
  );
}
