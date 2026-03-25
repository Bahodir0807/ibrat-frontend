export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function formatPerson(user) {
  if (!user) return "—";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.username || user.name || "—";
}

export function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

export function splitTasks(text) {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
