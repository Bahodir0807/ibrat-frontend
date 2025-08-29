import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setRole(payload.role || "student");
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  if (!role) return null;

  return (
    <div>
      {role === "student" && <p>Привет, ученик! Тут твой контент.</p>}
      {role === "teacher" && <p>Привет, учитель! Тут твой контент.</p>}
      {role === "admin" && <p>Привет, админ! Тут твой контент.</p>}
      {role === "panda" && <p>Привет, суперроль! Тут твой контент.</p>}
      {role === "guest" && <p>Привет, гость! Тут твой контент.</p>}
      <button onClick={() => navigate("/login")}>Выйти</button>
      <button onClick={() => navigate("/users")}>Пользователи</button>
    </div>
  );
}
