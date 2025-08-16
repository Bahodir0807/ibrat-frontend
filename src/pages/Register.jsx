import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [roleKey, setRoleKey] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username || !phoneNumber || !password) {
      setMessage("❌ Заполните все обязательные поля");
      return;
    }
    if (role !== "student" && !roleKey) {
      setMessage("❌ Введите ключ доступа для выбранной роли");
      return;
    }

    try {
      const res = await fetch("https://b.sultonoway.uz/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, phoneNumber, password, role, roleKey }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Зарегистрирован!");
        // Сброс формы
        setUsername("");
        setPhoneNumber("");
        setPassword("");
        setRole("student");
        setRoleKey("");
        setMessage("✅ Зарегистрирован!");
        localStorage.setItem("role", role);
        navigate("/");
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (err) {
      setMessage("❌ Ошибка сети");
      console.log(err); // твой console.log остаётся
    }
  };

  return (
    <div className={styles.registerContainer}>
      <form onSubmit={handleRegister} className={styles.registerForm}>
        <h2>Регистрация</h2>

        <input
          type="text"
          placeholder="Имя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="tel"
          placeholder="Номер телефона"
          pattern="\+?\d{10,15}"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="student">Ученик</option>
          <option value="teacher">Учитель</option>
          <option value="admin">Админ</option>
          <option value="panda">🐼 Суперроль (panda)</option>
        </select>

        {role !== "student" && (
          <input
            type="text"
            placeholder="Ключ для доступа (roleKey)"
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
          />
        )}

        <button type="submit">
          Зарегистрироваться
        </button>

        {message && (
          <div className={`${styles.message} ${message.includes('✅') ? styles.success : styles.error}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
