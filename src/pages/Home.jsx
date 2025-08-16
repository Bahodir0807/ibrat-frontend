import { useEffect, useState } from "react";

export default function Home() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
  }, []);

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
