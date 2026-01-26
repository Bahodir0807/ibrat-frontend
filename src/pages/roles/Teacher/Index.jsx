import { useNavigate } from "react-router-dom";
export default function Teacher() {
  const navigate = useNavigate();
  const ui = {
    page: { minHeight: "100vh", background: "#0f172a", padding: "32px 16px", boxSizing: "border-box" },
    card: { maxWidth: 960, margin: "0 auto", background: "#0b1222", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.35)" },
    title: { color: "#e2e8f0", fontSize: 24, fontWeight: 700, margin: 0 },
    text: { color: "#94a3b8", marginTop: 8 },
    actions: { display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" },
    btn: { background: "linear-gradient(180deg,#22c55e,#16a34a)", color: "white", border: "none", padding: "10px 14px", borderRadius: 10, fontWeight: 600, cursor: "pointer", boxShadow: "0 6px 14px rgba(34,197,94,0.25)" },
  };
  return (
    <div style={ui.page}>
      <div style={ui.card}>
        <h2 style={ui.title}>Кабинет учителя</h2>
        <p style={ui.text}>Добро пожаловать! Здесь будет контент для роли teacher.</p>
        <div style={ui.actions}>
          <button style={ui.btn} onClick={() => navigate("/teacher/attendance")}>Перейти к посещаемости</button>
        </div>
      </div>
    </div>
  );
}
