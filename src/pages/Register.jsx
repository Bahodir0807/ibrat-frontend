import { useState } from "react";
import { register } from "../api/auth";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await register({ username, password });
      alert("Регистрация успешна!");
    } catch (err) {
      alert(err?.response?.data?.message || "Ошибка регистрации");
    }
  };

  return (
    <div>
      <h2>Регистрация</h2>
      <input
        placeholder="Имя"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        placeholder="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleRegister}>Зарегистрироваться</button>
    </div>
  );
}
