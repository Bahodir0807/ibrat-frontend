import { useState } from "react";
import { login } from "../api/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await login({ username, password });

      const token = res.data.token;
      console.log("🔥 Токен:", token);

      alert("Вход успешен!");
    } catch (err) {
      alert(err?.response?.data?.message || "Ошибка входа");
    }
  };

  return (
    <div>
      <h2>Вход</h2>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        placeholder="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Войти</button>
    </div>
  );
}
