export default function Admin() {
  const ui = {
    page: { minHeight: "100vh", background: "#0f172a", padding: "32px 16px", boxSizing: "border-box" },
    card: { maxWidth: 960, margin: "0 auto", background: "#0b1222", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.35)" },
    title: { color: "#e2e8f0", fontSize: 24, fontWeight: 700, margin: 0 },
    text: { color: "#94a3b8", marginTop: 8 },
  };
  return (
    <div style={ui.page}>
      <div style={ui.card}>
        <h2 style={ui.title}>Панель администратора</h2>
        <p style={ui.text}>Добро пожаловать! Здесь будет контент для роли admin.</p>
      </div>
    </div>
  );
}
