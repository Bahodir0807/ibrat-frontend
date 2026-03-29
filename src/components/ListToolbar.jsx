export default function ListToolbar({
  value,
  onChange,
  placeholder = "Search...",
  summary,
  action,
  showSearch = true,
}) {
  return (
    <div className="list-toolbar">
      {showSearch ? (
        <input
          className="list-toolbar__search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      ) : <div />}
      <div className="list-toolbar__meta">
        {summary ? <span className="muted">{summary}</span> : null}
        {action}
      </div>
    </div>
  );
}
