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

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#0f172a",
      padding: "32px 16px",
      boxSizing: "border-box",
    },
    container: {
      maxWidth: 960,
      margin: "0 auto",
      background: "#0b1222",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: 24,
      boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    title: {
      color: "#e2e8f0",
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: 0.3,
      margin: 0,
    },
    subtitle: {
      color: "#94a3b8",
      fontSize: 14,
      marginTop: 4,
    },
    actions: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      marginTop: 12,
    },
    buttonPrimary: {
      background: "linear-gradient(180deg,#3b82f6,#1d4ed8)",
      color: "white",
      border: "none",
      padding: "10px 14px",
      borderRadius: 10,
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 6px 14px rgba(59,130,246,0.35)",
    },
    buttonGhost: {
      background: "transparent",
      color: "#cbd5e1",
      border: "1px solid rgba(255,255,255,0.12)",
      padding: "10px 14px",
      borderRadius: 10,
      fontWeight: 600,
      cursor: "pointer",
    },
    card: {
      background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
    },
    cardTitle: {
      color: "#e2e8f0",
      fontWeight: 700,
      marginBottom: 6,
    },
    cardText: {
      color: "#94a3b8",
      margin: 0,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Главная</h2>
            <div style={styles.subtitle}>Добро пожаловать! Ваша роль: {role}</div>
          </div>
          <div style={styles.actions}>
            <button style={styles.buttonGhost} onClick={() => navigate("/login")}>
              Выйти
            </button>
            <button style={styles.buttonPrimary} onClick={() => navigate("/users")}>
              Пользователи
            </button>
          </div>
        </div>

        {role === "student" && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Привет, ученик!</div>
            <p style={styles.cardText}>Тут твой контент.</p>
          </div>
        )}
        {role === "teacher" && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Привет, учитель!</div>
            <p style={styles.cardText}>Тут твой контент.</p>
          </div>
        )}
        {role === "admin" && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Привет, админ!</div>
            <p style={styles.cardText}>Тут твой контент.</p>
          </div>
        )}
        {role === "panda" && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Привет, суперроль!</div>
            <p style={styles.cardText}>Тут твой контент.</p>
          </div>
        )}
        {role === "guest" && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Привет, гость!</div>
            <p style={styles.cardText}>Тут твой контент.</p>
          </div>
        )}
      </div>
    </div>
  );
}
