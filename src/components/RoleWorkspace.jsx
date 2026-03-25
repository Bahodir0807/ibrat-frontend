import { useMemo, useState } from "react";

export default function RoleWorkspace({ sections, initialSection, renderHeaderAside }) {
  const normalizedSections = useMemo(() => sections.filter(Boolean), [sections]);
  const [active, setActive] = useState(initialSection || normalizedSections[0]?.key);
  const current = normalizedSections.find((section) => section.key === active) || normalizedSections[0];

  if (!current) {
    return null;
  }

  return (
    <div className="role-workspace">
      <aside className="role-workspace__sidebar">
        <div className="role-workspace__sidebar-head">
          <p className="eyebrow">Departments</p>
          <h3>Sections</h3>
        </div>
        <div className="role-workspace__nav">
          {normalizedSections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`role-workspace__nav-item ${section.key === current.key ? "is-active" : ""}`}
              onClick={() => setActive(section.key)}
            >
              <span>{section.label}</span>
              {section.note ? <small>{section.note}</small> : null}
            </button>
          ))}
        </div>
      </aside>

      <div className="role-workspace__content">
        <div className="role-workspace__content-head">
          <div>
            <p className="eyebrow">Department</p>
            <h3>{current.label}</h3>
            {current.description ? <p className="muted">{current.description}</p> : null}
          </div>
          {renderHeaderAside ? renderHeaderAside(current) : null}
        </div>
        <div className="role-workspace__panel">{current.render()}</div>
      </div>
    </div>
  );
}
