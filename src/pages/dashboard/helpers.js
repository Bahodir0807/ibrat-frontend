export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function formatPerson(user) {
  if (!user) return "-";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.username || user.name || "-";
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

export const WEEKDAY_OPTIONS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const WEEKDAY_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function formatWeekday(value) {
  if (!value) return "-";

  const directMatch = WEEKDAY_OPTIONS.find((item) => item.value === value);
  if (directMatch) {
    return directMatch.label;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

export function formatTime(value) {
  if (!value) return "-";

  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatScheduleSlot(item) {
  if (!item) return "-";

  const start = formatTime(item.timeStart);
  const end = formatTime(item.timeEnd);

  if (!item.timeStart && !item.timeEnd) {
    return "-";
  }

  return `${start} - ${end}`;
}

export function buildSchedulePayload(draft) {
  const dayIndex = WEEKDAY_INDEX[draft.weekday];

  if (dayIndex === undefined) {
    return {
      course: draft.course,
      room: draft.room,
      teacher: draft.teacher,
      group: draft.group || undefined,
      date: "",
      timeStart: "",
      timeEnd: "",
    };
  }

  const now = new Date();
  const baseDate = new Date(now);
  const diff = (dayIndex - now.getDay() + 7) % 7;
  baseDate.setDate(now.getDate() + diff);

  const [startHour = "00", startMinute = "00"] = String(draft.timeStart || "00:00").split(":");
  const [endHour = "00", endMinute = "00"] = String(draft.timeEnd || "00:00").split(":");

  const sessionDate = new Date(baseDate);
  sessionDate.setHours(12, 0, 0, 0);

  const startDate = new Date(baseDate);
  startDate.setHours(Number(startHour), Number(startMinute), 0, 0);

  const endDate = new Date(baseDate);
  endDate.setHours(Number(endHour), Number(endMinute), 0, 0);

  return {
    course: draft.course,
    room: draft.room,
    teacher: draft.teacher,
    group: draft.group || undefined,
    date: sessionDate.toISOString(),
    timeStart: startDate.toISOString(),
    timeEnd: endDate.toISOString(),
  };
}
