import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleTitles = {
  owner: "Owner",
  admin: "Admin",
  panda: "Panda",
  teacher: "Teacher",
  student: "Student",
  guest: "Guest",
};

export function AppShell({ title, subtitle, actions, children }) {
  const { role, user, logout, isMockSession } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <div className="app-brand__badge">IB</div>
          <div>
            <h1>Ibrat Panel</h1>
            <p>Connected to backend</p>
          </div>
        </div>

        <nav className="app-nav">
          <Link to="/">Dashboard</Link>
          <Link to="/users">Users</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>

        <div className="app-profile">
          <div className="app-profile__label">Signed in as</div>
          <div className="app-profile__name">{user?.username || "Unknown user"}</div>
          <div className="app-profile__role">{roleTitles[role] || role || "Guest"}</div>
          <button className="button button--ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div>
            <p className="eyebrow">{roleTitles[role] || "Role"}</p>
            <h2>{title}</h2>
            {subtitle ? <p className="muted">{subtitle}</p> : null}
          </div>
          <div className="app-header__actions">{actions}</div>
        </header>
        {isMockSession ? (
          <div className="banner">
            Mock mode is active. The frontend is running without backend and stores data in localStorage.
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}

export function SectionCard({ title, subtitle, children, action }) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatStrip({ items }) {
  return (
    <div className="stat-strip">
      {items.map((item) => (
        <article className="stat-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.note ? <small>{item.note}</small> : null}
        </article>
      ))}
    </div>
  );
}

export function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

export function DataTable({ columns, rows, emptyText = "No data yet" }) {
  if (!rows?.length) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row._id || index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
