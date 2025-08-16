import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token || !userRole) {
      navigate("/login");
      return;
    }

    setRole(userRole);
  }, [navigate]);

  if (!role) return <p>Загрузка...</p>;

  return (
    <div>
      {role === "student" && <p>Привет, ученик! Тут твой контент.</p>}
      {role === "teacher" && <p>Привет, учитель! Тут твой контент.</p>}
      {role === "admin" && <p>Привет, админ! Тут твой контент.</p>}
      {role === "panda" && <p>Привет, суперроль 🐼! Тут твой контент.</p>}
    </div>
  );
}
