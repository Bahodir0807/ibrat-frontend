import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../context/I18nContext";

export function AppShell({ title, subtitle, actions, children }) {
  const { role, user, logout, isMockSession } = useAuth();
  const { theme, themes, setTheme } = useTheme();
  const { language, languages, setLanguage, t, tx } = useI18n();
  const roleTitle = t(`roles.${role}`, role || "Guest");

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <div className="app-brand__badge">IB</div>
          <div>
            <h1>Ibrat Panel</h1>
            <p>{t("brand.connected", "Connected to backend")}</p>
          </div>
        </div>

        <nav className="app-nav">
          <Link to="/">{t("nav.dashboard", "Dashboard")}</Link>
          <Link to="/users">{t("nav.users", "Users")}</Link>
          <Link to="/login">{t("nav.login", "Login")}</Link>
          <Link to="/register">{t("nav.register", "Register")}</Link>
        </nav>

        <div className="preference-card">
          <label>
            <span>{t("theme.label", "Theme")}</span>
            <select value={theme} onChange={(event) => setTheme(event.target.value)}>
              {themes.map((item) => (
                <option key={item} value={item}>
                  {t(`theme.${item}`, item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("lang.label", "Language")}</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              {languages.map((item) => (
                <option key={item} value={item}>
                  {t(`lang.${item}`, item)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="app-profile">
          <div className="app-profile__label">{t("profile.signedInAs", "Signed in as")}</div>
          <div className="app-profile__name">{user?.username || "Unknown user"}</div>
          <div className="app-profile__role">{roleTitle}</div>
          <button className="button button--ghost" onClick={logout}>
            {t("common.logout", "Logout")}
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div>
            <p className="eyebrow">{roleTitle}</p>
            <h2>{tx(title)}</h2>
            {subtitle ? <p className="muted">{tx(subtitle)}</p> : null}
          </div>
          <div className="app-header__actions">{actions}</div>
        </header>
        {isMockSession ? (
          <div className="banner">
            {t("banner.mock", "Mock mode is active. The frontend is running without backend and stores data in localStorage.")}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}

export function SectionCard({ title, subtitle, children, action }) {
  const { tx } = useI18n();

  return (
    <section className="section-card">
      <div className="section-card__header">
        <div>
          <h3>{tx(title)}</h3>
          {subtitle ? <p>{tx(subtitle)}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatStrip({ items }) {
  const { tx } = useI18n();

  return (
    <div className="stat-strip">
      {items.map((item) => (
        <article className="stat-card" key={item.label}>
          <span>{tx(item.label)}</span>
          <strong>{item.value}</strong>
          {item.note ? <small>{tx(item.note)}</small> : null}
        </article>
      ))}
    </div>
  );
}

export function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

export function DataTable({ columns, rows, emptyText = "No data yet" }) {
  const { t, tx } = useI18n();

  if (!rows?.length) {
    return <EmptyState text={tx(emptyText || t("common.noData", "No data yet"))} />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{tx(column.label)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row._id || index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {(() => {
                    const value = column.render ? column.render(row) : row[column.key];
                    return typeof value === "string" ? tx(value) : value;
                  })()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
