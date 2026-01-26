import { useState } from "react";
import axios from "axios";

const API = axios.create({
  baseURL: "https://b.sultonoway.uz",
  withCredentials: true,
});

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "guest",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/register", form);
      setMessage("✅ Успешно зарегистрирован!");
      setForm({ username: "", password: "", role: "guest" });
    } catch (err) {
      setMessage("❌ Ошибка регистрации: " + (err.response?.data?.message || "Неизвестная ошибка"));
    }
  };

  const ui = {
    page: {
      minHeight: "100vh",
      background: "#0f172a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      boxSizing: "border-box",
    },
    card: {
      width: "100%",
      maxWidth: 420,
      background: "#0b1222",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: 24,
      boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
    },
    title: {
      margin: 0,
      fontSize: 24,
      fontWeight: 700,
      color: "#e2e8f0",
      textAlign: "center",
    },
    form: {
      marginTop: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },
    input: {
      background: "#0a1020",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#e2e8f0",
      padding: "10px 12px",
      borderRadius: 10,
      outline: "none",
      width: "100%",
    },
    select: {
      background: "#0a1020",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#e2e8f0",
      padding: "10px 12px",
      borderRadius: 10,
      outline: "none",
      width: "100%",
      cursor: "pointer",
    },
    button: {
      marginTop: 4,
      background: "linear-gradient(180deg,#3b82f6,#1d4ed8)",
      color: "white",
      border: "none",
      padding: "10px 14px",
      borderRadius: 10,
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 6px 14px rgba(59,130,246,0.35)",
      width: "100%",
    },
    message: {
      textAlign: "center",
      fontSize: 12,
      color: "#94a3b8",
      marginTop: 8,
    },
  };

  return (
    <div style={ui.page}>
      <form onSubmit={handleSubmit} style={ui.card}>
        <h1 style={ui.title}>Регистрация</h1>

        <input
          type="text"
          name="username"
          placeholder="Имя пользователя"
          value={form.username}
          onChange={handleChange}
          style={ui.input}
          autoComplete="username"
        />

        <input
          type="password"
          name="password"
          placeholder="Пароль"
          value={form.password}
          onChange={handleChange}
          style={ui.input}
          autoComplete="new-password"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          style={ui.select}
        >
          <option value="student">Студент</option>
          <option value="guest">Гость</option>
        </select>

        <button type="submit" style={ui.button}>Зарегистрироваться</button>

        {message && <p style={ui.message}>{message}</p>}
      </form>
    </div>
  );
}
