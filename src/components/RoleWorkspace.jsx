import { useMemo, useState } from "react";
import { useI18n } from "../context/I18nContext";

export default function RoleWorkspace({ sections, initialSection, renderHeaderAside }) {
  const normalizedSections = useMemo(() => sections.filter(Boolean), [sections]);
  const [active, setActive] = useState(initialSection || normalizedSections[0]?.key);
  const current = normalizedSections.find((section) => section.key === active) || normalizedSections[0];
  const { t, tx } = useI18n();

  if (!current) {
    return null;
  }

  return (
    <div className="role-workspace">
      <aside className="role-workspace__sidebar">
        <div className="role-workspace__sidebar-head">
          <p className="eyebrow">{t("workspace.departments", "Departments")}</p>
          <h3>{t("workspace.sections", "Sections")}</h3>
        </div>
        <div className="role-workspace__nav">
          {normalizedSections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`role-workspace__nav-item ${section.key === current.key ? "is-active" : ""}`}
              onClick={() => setActive(section.key)}
              aria-pressed={section.key === current.key}
            >
              <span>{tx(section.label)}</span>
              {section.note ? <small>{tx(section.note)}</small> : null}
            </button>
          ))}
        </div>
      </aside>

      <div className="role-workspace__content">
        <div className="role-workspace__mobile-nav" aria-label={t("workspace.sections", "Sections")}>
          {normalizedSections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`role-workspace__chip ${section.key === current.key ? "is-active" : ""}`}
              onClick={() => setActive(section.key)}
              aria-pressed={section.key === current.key}
            >
              {tx(section.label)}
            </button>
          ))}
        </div>
        <div className="role-workspace__content-head">
          <div>
            <p className="eyebrow">{t("workspace.department", "Department")}</p>
            <h3>{tx(current.label)}</h3>
            {current.description ? <p className="muted">{tx(current.description)}</p> : null}
          </div>
          {renderHeaderAside ? renderHeaderAside(current) : null}
        </div>
        <div className="role-workspace__panel">{current.render()}</div>
      </div>
    </div>
  );
}
