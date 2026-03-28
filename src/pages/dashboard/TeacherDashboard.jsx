import { useEffect, useMemo, useState } from "react";
import { AppShell, DataTable, SectionCard, StatStrip } from "../../components/AppShell";
import RoleWorkspace from "../../components/RoleWorkspace";
import { useI18n } from "../../context/I18nContext";
import {
  attendanceApi,
  gradesApi,
  homeworkApi,
  notificationsApi,
  scheduleApi,
  usersApi,
} from "../../api/resources";
import { formatPerson, formatScheduleSlot, formatWeekday, normalizeList, splitTasks } from "./helpers";

const notificationTypes = ["payment", "homework", "grades", "attendance", "general"];

export default function TeacherDashboard() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [attendanceDraft, setAttendanceDraft] = useState({ userId: "", date: "", status: "present" });
  const [homeworkDraft, setHomeworkDraft] = useState({ userId: "", date: "", tasks: "" });
  const [gradeDraft, setGradeDraft] = useState({ userId: "", subject: "", score: "" });
  const [notificationDraft, setNotificationDraft] = useState({ userId: "", message: "", type: "general" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [studentsData, scheduleData] = await Promise.all([
          usersApi.students(),
          scheduleApi.mine(),
        ]);
        if (!cancelled) {
          setStudents(normalizeList(studentsData));
          setSchedule(normalizeList(scheduleData));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.response?.data?.message || loadError?.message || "Failed to load teacher workspace");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshIndex]);

  async function handleAction(action, payload, reset) {
    try {
      await action(payload);
      reset?.();
      setRefreshIndex((value) => value + 1);
    } catch (submitError) {
      alert(submitError?.response?.data?.message || submitError?.message || "Action failed");
    }
  }

  const sections = useMemo(
    () => [
      {
        key: "overview",
        label: "Overview",
        note: "Teaching summary",
        description: "Current students, teaching load and quick status.",
        render: () => (
          <div className="stack">
            <StatStrip
              items={[
                { label: "Students", value: students.length },
                { label: "Schedule items", value: schedule.length },
                { label: "Attendance", value: "ready" },
                { label: "Homework", value: "ready" },
              ]}
            />
            <SectionCard title="My schedule" subtitle="Current teacher schedule">
              <DataTable
                rows={schedule}
                columns={[
                  { key: "course", label: "Course", render: (row) => row.course?.name || "—" },
                  { key: "room", label: "Room", render: (row) => row.room?.name || "—" },
                  { key: "weekday", label: "Day", render: (row) => formatWeekday(row.weekday || row.date) },
                  { key: "time", label: "Time", render: (row) => formatScheduleSlot(row) },
                ]}
              />
            </SectionCard>
          </div>
        ),
      },
      {
        key: "students",
        label: "Students",
        note: "Directory",
        description: "Reference list of students available to the teacher tools.",
        render: () => (
          <SectionCard title="Students" subtitle="Loaded from /users/students">
            <DataTable
              rows={students}
              columns={[
                { key: "username", label: "Username" },
                { key: "name", label: "Name", render: (row) => formatPerson(row) },
                { key: "phoneNumber", label: "Phone" },
              ]}
            />
          </SectionCard>
        ),
      },
      {
        key: "attendance",
        label: "Attendance",
        note: "One function",
        description: "Mark attendance for a single student and date.",
        render: () => (
          <SectionCard title="Mark attendance" subtitle="One record per request">
            <form className="form-grid" onSubmit={(e) => {
              e.preventDefault();
              handleAction(attendanceApi.create, attendanceDraft, () => setAttendanceDraft({ userId: "", date: "", status: "present" }));
            }}>
              <div className="form-row">
                <select value={attendanceDraft.userId} onChange={(e) => setAttendanceDraft({ ...attendanceDraft, userId: e.target.value })}>
                  <option value="">Select student</option>
                  {students.map((student) => <option key={student._id} value={student._id}>{formatPerson(student)}</option>)}
                </select>
                <input type="datetime-local" value={attendanceDraft.date} onChange={(e) => setAttendanceDraft({ ...attendanceDraft, date: e.target.value })} />
                <select value={attendanceDraft.status} onChange={(e) => setAttendanceDraft({ ...attendanceDraft, status: e.target.value })}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>
              <button className="button" type="submit">Save attendance</button>
            </form>
          </SectionCard>
        ),
      },
      {
        key: "homework",
        label: "Homework",
        note: "Assignments",
        description: "Assign homework to one student at a time.",
        render: () => (
          <SectionCard title="Assign homework" subtitle="Split tasks by line">
            <form className="form-grid" onSubmit={(e) => {
              e.preventDefault();
              handleAction(
                homeworkApi.create,
                { ...homeworkDraft, tasks: splitTasks(homeworkDraft.tasks) },
                () => setHomeworkDraft({ userId: "", date: "", tasks: "" }),
              );
            }}>
              <div className="form-row">
                <select value={homeworkDraft.userId} onChange={(e) => setHomeworkDraft({ ...homeworkDraft, userId: e.target.value })}>
                  <option value="">Select student</option>
                  {students.map((student) => <option key={student._id} value={student._id}>{formatPerson(student)}</option>)}
                </select>
                <input type="datetime-local" value={homeworkDraft.date} onChange={(e) => setHomeworkDraft({ ...homeworkDraft, date: e.target.value })} />
              </div>
              <textarea value={homeworkDraft.tasks} onChange={(e) => setHomeworkDraft({ ...homeworkDraft, tasks: e.target.value })} placeholder={"Task 1\nTask 2"} />
              <button className="button" type="submit">Create homework</button>
            </form>
          </SectionCard>
        ),
      },
      {
        key: "grades",
        label: "Grades",
        note: "Assessment",
        description: "Send a grade entry to one student.",
        render: () => (
          <SectionCard title="Add grade" subtitle="Direct scoring input">
            <form className="form-grid" onSubmit={(e) => {
              e.preventDefault();
              handleAction(
                gradesApi.create,
                { ...gradeDraft, score: Number(gradeDraft.score) },
                () => setGradeDraft({ userId: "", subject: "", score: "" }),
              );
            }}>
              <div className="form-row">
                <select value={gradeDraft.userId} onChange={(e) => setGradeDraft({ ...gradeDraft, userId: e.target.value })}>
                  <option value="">Select student</option>
                  {students.map((student) => <option key={student._id} value={student._id}>{formatPerson(student)}</option>)}
                </select>
                <input value={gradeDraft.subject} onChange={(e) => setGradeDraft({ ...gradeDraft, subject: e.target.value })} placeholder="Subject" />
                <input type="number" min="0" value={gradeDraft.score} onChange={(e) => setGradeDraft({ ...gradeDraft, score: e.target.value })} placeholder="Score" />
              </div>
              <button className="button" type="submit">Create grade</button>
            </form>
          </SectionCard>
        ),
      },
      {
        key: "notifications",
        label: "Notifications",
        note: "One user",
        description: "Send a direct Telegram notification through the backend.",
        render: () => (
          <SectionCard title="Send notification" subtitle="Admin/teacher notification endpoint">
            <form className="form-grid" onSubmit={(e) => {
              e.preventDefault();
              handleAction(
                notificationsApi.create,
                notificationDraft,
                () => setNotificationDraft({ userId: "", message: "", type: "general" }),
              );
            }}>
              <div className="form-row">
                <select value={notificationDraft.userId} onChange={(e) => setNotificationDraft({ ...notificationDraft, userId: e.target.value })}>
                  <option value="">Select student</option>
                  {students.map((student) => <option key={student._id} value={student._id}>{formatPerson(student)}</option>)}
                </select>
                <select value={notificationDraft.type} onChange={(e) => setNotificationDraft({ ...notificationDraft, type: e.target.value })}>
                  {notificationTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <textarea value={notificationDraft.message} onChange={(e) => setNotificationDraft({ ...notificationDraft, message: e.target.value })} placeholder="Message text" />
              <button className="button" type="submit">Send notification</button>
            </form>
          </SectionCard>
        ),
      },
      {
        key: "schedule",
        label: "Schedule",
        note: "My timetable",
        description: "Read-only section for the teacher schedule feed.",
        render: () => (
          <SectionCard title="My schedule" subtitle="Pulled from /schedule/me">
            <DataTable
              rows={schedule}
              columns={[
                { key: "course", label: "Course", render: (row) => row.course?.name || "—" },
                { key: "room", label: "Room", render: (row) => row.room?.name || "—" },
                { key: "weekday", label: "Day", render: (row) => formatWeekday(row.weekday || row.date) },
                { key: "time", label: "Time", render: (row) => formatScheduleSlot(row) },
              ]}
            />
          </SectionCard>
        ),
      },
    ],
    [students, schedule, attendanceDraft, homeworkDraft, gradeDraft, notificationDraft],
  );

  return (
    <AppShell
      title={t("teacher.title", "Teacher Dashboard")}
      subtitle={t("teacher.subtitle", "Attendance, homework, grades, notifications and schedule")}
      actions={<button className="button" onClick={() => setRefreshIndex((value) => value + 1)}>{t("common.refreshAll", "Refresh all")}</button>}
    >
      {error ? <div className="banner banner--error">{error}</div> : null}
      {loading ? <div className="empty-state">{t("common.loadingWorkspace", "Loading workspace...")}</div> : null}
      <RoleWorkspace sections={sections} initialSection="overview" />
    </AppShell>
  );
}
