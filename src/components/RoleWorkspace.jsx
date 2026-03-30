import { useI18n } from "../context/I18nContext";

export default function RoleWorkspace({ section, renderHeaderAside }) {
  const { t, tx } = useI18n();

  if (!section) {
    return null;
  }

  return (
    <div className="role-workspace">
      <div className="role-workspace__content role-workspace__content--full">
        <div className="role-workspace__content-head">
          <div>
            <p className="eyebrow">{t("workspace.department", "Department")}</p>
            <h3>{tx(section.label)}</h3>
            {section.description ? <p className="muted">{tx(section.description)}</p> : null}
          </div>
          {renderHeaderAside ? renderHeaderAside(section) : null}
        </div>
        <div className="role-workspace__panel">{section.render()}</div>
      </div>
    </div>
  );
}
