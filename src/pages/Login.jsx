import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import jwt_decode from "jwt-decode";
import styles from "./Login.module.css";

export default function Login() {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await login(credentials);
      const token = data.token;
      if (!token) throw new Error("Токен не получен");

      localStorage.setItem("token", token);

      let decoded;
      try {
        decoded = jwt_decode(token);
      } catch (err) {
        console.error("Ошибка декодирования JWT:", err);
        alert("Ошибка входа: неверный токен");
        return;
      }

      const role = decoded?.role || "student";
      localStorage.setItem("role", role);

      console.log("🔥 Token:", token);
      console.log("🔥 Role:", role);

      alert("Вход успешен!");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Ошибка входа");
    }
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.id]: e.target.value });
  };

  return (
    <div className={styles.loginContainer}>
      <form className={styles.loginForm} onSubmit={handleLogin}>
        <label htmlFor="username">
          Имя пользователя
          <input
            id="username"
            type="text"
            placeholder="Имя пользователя"
            value={credentials.username}
            onChange={handleChange}
          />
        </label>

        <label htmlFor="password">
          Пароль
          <input
            id="password"
            type="password"
            placeholder="Пароль"
            value={credentials.password}
            onChange={handleChange}
          />
        </label>

        <button type="submit">Войти</button>
      </form>
    </div>
  );
}
