import { useState } from "react";
import { login } from "../api/auth";
import styles from "./Login.module.css";

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await login(credentials);
      const token = data.token;
      console.log("🔥 Token:", token);
      alert("Вход успешен!");
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
