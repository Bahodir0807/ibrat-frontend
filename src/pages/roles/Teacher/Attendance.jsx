import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TeacherAttendance() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = String(localStorage.getItem("role") || "").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!["teacher", "admin", "panda", "owner"].includes(role)) {
      navigate("/");
      return;
    }
    fetch("https://b.sultonoway.uz/teachers/me/groups", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setGroups(list);
        if (list[0]?.groupId || list[0]?._id) {
          setSelectedGroup(String(list[0].groupId || list[0]._id));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate, role, token]);

  useEffect(() => {
    if (!selectedGroup || !date) {
      setLessons([]);
      setSelectedLesson("");
      return;
    }
    const params = new URLSearchParams({ groupId: selectedGroup, date });
    fetch(`https://b.sultonoway.uz/schedule?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setLessons(list);
        setSelectedLesson(list[0]?.lessonId || list[0]?._id || "");
      })
      .catch(() => {
        setLessons([]);
        setSelectedLesson("");
      });
  }, [selectedGroup, date, token]);

  useEffect(() => {
    if (!selectedGroup) {
      setStudents([]);
      setAttendance({});
      return;
    }
    fetch(`https://b.sultonoway.uz/groups/${selectedGroup}/students`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setStudents(list);
        const initial = Object.fromEntries(
          list.map((s) => [String(s.studentId || s._id), "present"]) // default present
        );
        setAttendance(initial);
      })
      .catch(() => {
        setStudents([]);
        setAttendance({});
      });
  }, [selectedGroup, token]);

  const allStatuses = useMemo(
    () => [
      { value: "present", label: "Присутствует" },
      { value: "absent", label: "Отсутствует" },
      { value: "late", label: "Опоздал" },
      { value: "excused", label: "Уважительная" },
    ],
    []
  );

  const ui = {
    page: { minHeight: "100vh", background: "#0f172a", padding: "32px 16px", boxSizing: "border-box" },
    card: { maxWidth: 1000, margin: "0 auto", background: "#0b1222", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.35)" },
    title: { color: "#e2e8f0", fontSize: 22, fontWeight: 700, margin: 0 },
    row: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 },
    select: { background: "#0a1020", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", padding: "10px 12px", borderRadius: 10, outline: "none" },
    date: { background: "#0a1020", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", padding: "10px 12px", borderRadius: 10, outline: "none" },
    tableWrap: { marginTop: 16, overflowX: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" },
    table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, color: "#cbd5e1", fontSize: 14 },
    th: { textAlign: "left", padding: "12px 16px", color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.06)" },
    td: { padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
    btnPrimary: { background: "linear-gradient(180deg,#22c55e,#16a34a)", color: "white", border: "none", padding: "10px 14px", borderRadius: 10, fontWeight: 600, cursor: "pointer", boxShadow: "0 6px 14px rgba(34,197,94,0.25)" },
    btnGhost: { background: "transparent", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.12)", padding: "10px 14px", borderRadius: 10, fontWeight: 600, cursor: "pointer" },
    actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 },
  };

  const bulkSet = (value) => {
    setAttendance((prev) => {
      const next = { ...prev };
      students.forEach((s) => {
        const id = String(s.studentId || s._id);
        next[id] = value;
      });
      return next;
    });
  };

  const setOne = (id, value) => {
    setAttendance((prev) => ({ ...prev, [id]: value }));
  };

  const submit = async () => {
    // Отправляем посещаемость группой: по текущему бэку требуется один POST на каждого студента
    // POST /attendance  body: { userId, date, status }
    try {
      setSubmitting(true);
      const tasks = students.map((s) => {
        const userId = String(s.studentId || s._id);
        const status = attendance[userId] || "present";
        return fetch(`https://b.sultonoway.uz/attendance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId, date, status }),
        }).then((r) => (r.ok ? null : Promise.reject(r)));
      });
      await Promise.all(tasks);
      alert("Посещаемость сохранена");
    } catch (e) {
      alert("Ошибка сохранения посещаемости");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Загрузка…</div>;

  return (
    <div style={ui.page}>
      <div style={ui.card}>
        <h2 style={ui.title}>Посещаемость (по группе)</h2>
        <div style={ui.row}>
          <select style={ui.select} value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            {groups.map((g) => (
              <option key={String(g.groupId || g._id)} value={String(g.groupId || g._id)}>
                {g.name || g.title || `Группа ${String(g.groupId || g._id)}`}
              </option>
            ))}
          </select>
          <input style={ui.date} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select style={ui.select} value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)}>
            {lessons.map((l) => (
              <option key={String(l.lessonId || l._id)} value={String(l.lessonId || l._id)}>
                {l.topic || l.title || `${(l.start || "").slice(11,16)} ${(l.end || "").slice(11,16)}`}
              </option>
            ))}
          </select>
        </div>

        <div style={ui.actions}>
          <button style={ui.btnPrimary} onClick={() => bulkSet("present")}>Все присутствуют</button>
          <button style={ui.btnGhost} onClick={() => bulkSet("absent")}>Все отсутствуют</button>
          <button style={ui.btnGhost} onClick={() => bulkSet("late")}>Все опоздали</button>
          <button style={ui.btnGhost} onClick={() => bulkSet("excused")}>Все уважительная</button>
          <button style={ui.btnPrimary} onClick={submit} disabled={!selectedLesson || submitting}>
            {submitting ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>

        <div style={ui.tableWrap}>
          <table style={ui.table}>
            <thead>
              <tr>
                <th style={ui.th}>Студент</th>
                <th style={ui.th}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => {
                const id = String(s.studentId || s._id);
                return (
                  <tr key={id} style={{ background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                    <td style={ui.td}>{s.fullName || s.username || `ID ${id}`}</td>
                    <td style={ui.td}>
                      <select style={ui.select} value={attendance[id] || "present"} onChange={(e) => setOne(id, e.target.value)}>
                        {allStatuses.map((st) => (
                          <option key={st.value} value={st.value}>{st.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
