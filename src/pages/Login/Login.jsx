import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth";

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      if (!credentials.username || !credentials.password) {
        alert("Введите имя пользователя и пароль.");
        return;
      }

      setLoading(true);

      const { data } = await login(credentials);
      const token = data?.token || data?.accessToken || data?.access_token;
      if (!token) {
        throw new Error("Токен не получен от сервера");
      }
      localStorage.setItem("token", token);
      const base64 = token.split(".")[1];
      const base64Url = base64?.replace(/-/g, "+").replace(/_/g, "/");
      const json = atob(base64Url);
      const payload = JSON.parse(decodeURIComponent(
        Array.prototype.map
          .call(json, (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      ));
      const role = String(payload?.role ?? "student").toLowerCase().trim();
      localStorage.setItem("role", role);

      console.log("🔥 Token:", token);
      console.log("🔥 Role:", role);

      alert("Вход успешен!");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Ошибка входа. Попробуйте ещё раз."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.id]: e.target.value });
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
    },
    subtitle: {
      margin: "6px 0 0",
      color: "#94a3b8",
      fontSize: 14,
    },
    form: {
      marginTop: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },
    label: {
      color: "#cbd5e1",
      fontSize: 14,
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    input: {
      background: "#0a1020",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#e2e8f0",
      padding: "10px 12px",
      borderRadius: 10,
      outline: "none",
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
    },
    buttonDisabled: {
      marginTop: 4,
      background: "#1f2a44",
      color: "#94a3b8",
      border: "1px solid rgba(255,255,255,0.06)",
      padding: "10px 14px",
      borderRadius: 10,
      fontWeight: 600,
      cursor: "not-allowed",
    },
  };

  return (
    <div style={ui.page}>
      <div style={ui.card}>
        <h2 style={ui.title}>Вход в систему</h2>
        <p style={ui.subtitle}>Введите логин и пароль для продолжения</p>
        <form onSubmit={handleLogin} style={ui.form}>
          <label htmlFor="username" style={ui.label}>
            Имя пользователя
            <input
              id="username"
              type="text"
              placeholder="Имя пользователя"
              value={credentials.username}
              onChange={handleChange}
              style={ui.input}
              autoComplete="username"
            />
          </label>
          <label htmlFor="password" style={ui.label}>
            Пароль
            <input
              id="password"
              type="password"
              placeholder="Пароль"
              value={credentials.password}
              onChange={handleChange}
              style={ui.input}
              autoComplete="current-password"
            />
          </label>
          <button type="submit" disabled={loading} style={loading ? ui.buttonDisabled : ui.button}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
