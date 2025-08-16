import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import styles from "./Login.module.css";

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await login(credentials);
      const token = data.token;
      const role = data.role;

      console.log("🔥 Token:", token);
      console.log("🔥 Role:", role);

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      alert("Вход успешен!");
      navigate("/");
    } catch ({ response: { data: { message } = {} } = {} }) {
      alert(message || "Ошибка входа");
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
