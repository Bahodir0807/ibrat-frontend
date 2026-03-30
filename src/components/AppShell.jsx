import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../context/I18nContext";

export function AppShell({ title, subtitle, actions, children, sidebarSections = [], activeSection, onSectionChange }) {
  const { role, user, logout, isMockSession } = useAuth();
  const { theme, themes, setTheme } = useTheme();
  const { language, languages, setLanguage, t, tx } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const roleTitle = t(`roles.${role}`, role || "Guest");
  const activeSectionTitle = sidebarSections.find((section) => section.key === activeSection)?.label;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__scroll">
          <div className="app-brand">
            <div className="app-brand__badge">IB</div>
            <div>
              <h1>Ibrat Panel</h1>
              <p>{roleTitle}</p>
            </div>
          </div>

          {sidebarSections.length ? (
            <div className="app-sidebar-sections">
              <div className="role-workspace__sidebar-head">
                <p className="eyebrow">{t("workspace.departments", "Departments")}</p>
                <h3>{t("workspace.sections", "Sections")}</h3>
              </div>
              <div className="role-workspace__nav">
                {sidebarSections.map((section) => (
                  <button
                    key={section.key}
                    type="button"
                    className={`role-workspace__nav-item ${section.key === activeSection ? "is-active" : ""}`}
                    onClick={() => onSectionChange?.(section.key)}
                    aria-pressed={section.key === activeSection}
                  >
                    <span>{tx(section.label)}</span>
                    {section.note ? <small>{tx(section.note)}</small> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="app-sidebar__footer">
          <button
            className="button button--ghost app-settings-toggle"
            type="button"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((value) => !value)}
          >
            {t("settings.title", "Settings")}
          </button>

          {settingsOpen ? (
            <div className="preference-card app-settings-panel">
              <div className="app-profile">
                <div className="app-profile__label">{t("profile.signedInAs", "Signed in as")}</div>
                <div className="app-profile__name">{user?.username || "Unknown user"}</div>
                <div className="app-profile__role">{roleTitle}</div>
                {activeSectionTitle ? <div className="app-profile__section">{tx(activeSectionTitle)}</div> : null}
              </div>

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

              <button className="button button--ghost" type="button" onClick={logout}>
                {t("common.logout", "Logout")}
              </button>
            </div>
          ) : null}
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

export function DataTable({
  columns,
  rows,
  emptyText = "No data yet",
  caption,
  pageSize = 8,
  defaultSortKey = "",
  defaultSortDirection = "asc",
}) {
  const { t, tx } = useI18n();
  const [sortState, setSortState] = useState({
    key: defaultSortKey,
    direction: defaultSortDirection,
  });
  const [page, setPage] = useState(1);

  const sortedRows = useMemo(() => {
    if (!sortState.key) return rows || [];

    const column = columns.find((item) => item.key === sortState.key);
    if (!column) return rows || [];

    const readValue = (row) => {
      if (column.sortValue) return column.sortValue(row);
      if (!column.render) return row[column.key];
      return row[column.key];
    };

    return [...(rows || [])].sort((left, right) => {
      const leftValue = readValue(left);
      const rightValue = readValue(right);

      if (leftValue == null && rightValue == null) return 0;
      if (leftValue == null) return 1;
      if (rightValue == null) return -1;

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortState.direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
      }

      return sortState.direction === "asc"
        ? String(leftValue).localeCompare(String(rightValue))
        : String(rightValue).localeCompare(String(leftValue));
    });
  }, [columns, rows, sortState]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedRows]);

  if (!rows?.length) {
    return <EmptyState text={tx(emptyText || t("common.noData", "No data yet"))} />;
  }

  const toggleSort = (column) => {
    const canSort = column.sortable !== false && (!column.render || column.sortValue);
    if (!canSort) return;

    setPage(1);
    setSortState((current) => {
      if (current.key !== column.key) {
        return { key: column.key, direction: "asc" };
      }

      return {
        key: column.key,
        direction: current.direction === "asc" ? "desc" : "asc",
      };
    });
  };

  return (
    <div className="table-card">
      <div className="table-wrap">
        <table className="data-table">
          <caption className="sr-only">{tx(caption || emptyText || t("common.noData", "No data yet"))}</caption>
          <thead>
            <tr>
              {columns.map((column) => {
                const isSortable = column.sortable !== false && (!column.render || column.sortValue);

                return (
                  <th key={column.key}>
                    <button
                      type="button"
                      className={`table-sort ${isSortable ? "" : "is-disabled"}`}
                      onClick={() => toggleSort(column)}
                      aria-label={`${tx(column.label)} ${sortState.key === column.key ? t(`common.sort.${sortState.direction}`, sortState.direction) : ""}`.trim()}
                    >
                      <span>{tx(column.label)}</span>
                      {sortState.key === column.key ? (
                        <span>{sortState.direction === "asc" ? t("common.sort.ascShort", "Asc") : t("common.sort.descShort", "Desc")}</span>
                      ) : null}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, index) => (
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
      {sortedRows.length > pageSize ? (
        <div className="table-pagination">
          <span className="muted">
            {`${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, sortedRows.length)} / ${sortedRows.length}`}
          </span>
          <div className="table-pagination__actions">
            <button
              className="button button--ghost"
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              {t("common.previous", "Previous")}
            </button>
            <span className="muted">{`${currentPage} / ${totalPages}`}</span>
            <button
              className="button button--ghost"
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              {t("common.next", "Next")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
