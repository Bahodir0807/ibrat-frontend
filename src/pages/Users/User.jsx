import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passwords, setPasswords] = useState({});
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (!token || !role) {
      navigate("/login");
      return;
    }

    if (role !== "admin" && role !== "panda" && role !== "owner") {
      navigate("/");
      return;
    }

    fetch("https://b.sultonoway.uz/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setUsers(
          list.sort((a, b) => String(a?.role || "").localeCompare(String(b?.role || "")))
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate, token, role]);

  const showPassword = async (userId) => {
    try {
      const res = await fetch(`https://b.sultonoway.uz/users/${userId}/password`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPasswords((prev) => ({ ...prev, [userId]: data?.password || "" }));

      // скрыть пароль через 10 секунд
      setTimeout(() => {
        setPasswords((prev) => ({ ...prev, [userId]: "" }));
      }, 10000);
    } catch (err) {
      console.error(err);
      alert("Не удалось получить пароль");
    }
  };

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
    tableWrap: {
      overflowX: "auto",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.06)",
    },
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      color: "#cbd5e1",
      fontSize: 14,
    },
    thead: {
      background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    },
    th: {
      textAlign: "left",
      padding: "12px 16px",
      color: "#94a3b8",
      fontWeight: 600,
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    td: {
      padding: "14px 16px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    row: {
      background: "transparent",
    },
    username: {
      color: "#e2e8f0",
      fontWeight: 600,
    },
    roleBadge: (r) => {
      const palette = {
        admin: { bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.35)" },
        panda: { bg: "rgba(99,102,241,0.12)", color: "#c7d2fe", border: "rgba(99,102,241,0.35)" },
        teacher: { bg: "rgba(16,185,129,0.12)", color: "#a7f3d0", border: "rgba(16,185,129,0.35)" },
        student: { bg: "rgba(59,130,246,0.12)", color: "#bfdbfe", border: "rgba(59,130,246,0.35)" },
        owner: { bg: "rgba(234,179,8,0.12)", color: "#fde68a", border: "rgba(234,179,8,0.35)" },
        default: { bg: "rgba(148,163,184,0.12)", color: "#cbd5e1", border: "rgba(148,163,184,0.35)" },
      };
      const c = palette[r] || palette.default;
      return {
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        textTransform: "capitalize",
      };
    },
    button: {
      background: "linear-gradient(180deg,#3b82f6,#1d4ed8)",
      color: "white",
      border: "none",
      padding: "10px 14px",
      borderRadius: 10,
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 6px 14px rgba(59,130,246,0.35)",
    },
    password: {
      display: "inline-block",
      padding: "6px 10px",
      borderRadius: 8,
      background: "rgba(250,204,21,0.08)",
      color: "#fde68a",
      border: "1px solid rgba(250,204,21,0.35)",
      fontWeight: 700,
      letterSpacing: 0.5,
    },
    loading: {
      color: "#94a3b8",
      textAlign: "center",
      padding: "48px 0",
      fontSize: 16,
    },
    empty: {
      color: "#94a3b8",
      textAlign: "center",
      padding: "24px 0",
      fontSize: 14,
    },
  };

  if (loading) return <div style={styles.loading}>Загрузка пользователей…</div>;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Все пользователи</h2>
            <div style={styles.subtitle}>Управление доступом и просмотр ролей</div>
          </div>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Имя</th>
                <th style={styles.th}>Роль</th>
                <th style={styles.th}>Пароль</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ ...styles.td, textAlign: "center" }}>
                    <div style={styles.empty}>Пользователей пока нет</div>
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr
                    key={user._id}
                    style={{
                      ...styles.row,
                      background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                    }}
                  >
                    <td style={styles.td}>
                      <span style={styles.username}>{user.username}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.roleBadge(user.role)}>{user.role}</span>
                    </td>
                    <td style={styles.td}>
                      {passwords[user._id] ? (
                        <span style={styles.password}>{passwords[user._id]}</span>
                      ) : (
                        <button style={styles.button} onClick={() => showPassword(user._id)}>
                          Показать пароль
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
