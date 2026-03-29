import { useEffect, useMemo, useState } from "react";
import { AppShell, DataTable, SectionCard, StatStrip } from "../../components/AppShell";
import RoleWorkspace from "../../components/RoleWorkspace";
import { attendanceApi, gradesApi, homeworkApi, paymentsApi, scheduleApi } from "../../api/resources";
import { formatDate, formatScheduleSlot, formatWeekday, normalizeList } from "./helpers";
import { useI18n } from "../../context/I18nContext";

export default function StudentDashboard() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [schedule, setSchedule] = useState([]);
  const [homework, setHomework] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [scheduleData, homeworkData, gradesData, attendanceData, paymentsData] =
          await Promise.all([
            scheduleApi.mine(),
            homeworkApi.mine(),
            gradesApi.mine(),
            attendanceApi.mine(),
            paymentsApi.mine(),
          ]);

        if (!cancelled) {
          setSchedule(normalizeList(scheduleData));
          setHomework(normalizeList(homeworkData));
          setGrades(normalizeList(gradesData));
          setAttendance(normalizeList(attendanceData));
          setPayments(normalizeList(paymentsData));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.response?.data?.message || loadError?.message || "Failed to load student workspace");
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

  const sections = useMemo(
    () => [
      {
        key: "overview",
        label: "Overview",
        note: "My progress",
        description: "Snapshot of the student personal cabinet.",
        render: () => (
          <div className="stack">
            <StatStrip
              items={[
                { label: "Schedule", value: schedule.length },
                { label: "Homework", value: homework.length },
                { label: "Grades", value: grades.length },
                { label: "Attendance", value: attendance.length },
                { label: "Payments", value: payments.length },
              ]}
            />
          </div>
        ),
      },
      {
        key: "schedule",
        label: "Schedule",
        note: "Timetable",
        description: "Your classes and room allocations.",
        render: () => (
          <SectionCard title="My schedule" subtitle="From /schedule/me">
            <DataTable
              rows={schedule}
              columns={[
                { key: "course", label: "Course", render: (row) => row.course?.name || "—" },
                { key: "group", label: "Group", render: (row) => row.group?.name || "—" },
                { key: "room", label: "Room", render: (row) => row.room?.name || "—" },
                { key: "weekday", label: "Day", render: (row) => formatWeekday(row.weekday || row.date) },
                { key: "time", label: "Time", render: (row) => formatScheduleSlot(row) },
              ]}
            />
          </SectionCard>
        ),
      },
      {
        key: "homework",
        label: "Homework",
        note: "Tasks",
        description: "All current homework assignments.",
        render: () => (
          <SectionCard title="Homework" subtitle="From /homework/me">
            <DataTable
              rows={homework}
              columns={[
                { key: "date", label: "Date", render: (row) => formatDate(row.date) },
                { key: "tasks", label: "Tasks", render: (row) => Array.isArray(row.tasks) ? row.tasks.join(", ") : "—" },
                { key: "completed", label: "Done", render: (row) => row.completed ? "Yes" : "No" },
              ]}
            />
          </SectionCard>
        ),
      },
      {
        key: "grades",
        label: "Grades",
        note: "Scores",
        description: "Received grades by subject.",
        render: () => (
          <SectionCard title="Grades" subtitle="From /grades/me">
            <DataTable
              rows={grades}
              columns={[
                { key: "subject", label: "Subject" },
                { key: "score", label: "Score" },
                { key: "date", label: "Date", render: (row) => formatDate(row.date) },
              ]}
            />
          </SectionCard>
        ),
      },
      {
        key: "attendance",
        label: "Attendance",
        note: "Presence",
        description: "Your attendance history.",
        render: () => (
          <SectionCard title="Attendance" subtitle="From /attendance/me">
            <DataTable
              rows={attendance}
              columns={[
                { key: "date", label: "Date", render: (row) => formatDate(row.date) },
                { key: "status", label: "Status" },
              ]}
            />
          </SectionCard>
        ),
      },
      {
        key: "payments",
        label: "Payments",
        note: "Finance",
        description: "Your payment records and confirmation states.",
        render: () => (
          <SectionCard title="Payments" subtitle="From /payments/me">
            <DataTable
              rows={payments}
              columns={[
                { key: "amount", label: "Amount" },
                { key: "paidAt", label: "Paid at", render: (row) => formatDate(row.paidAt) },
                { key: "isConfirmed", label: "Confirmed", render: (row) => row.isConfirmed ? "Yes" : "Pending" },
              ]}
            />
          </SectionCard>
        ),
      },
    ],
    [schedule, homework, grades, attendance, payments],
  );

  return (
    <AppShell
      title={t("student.title", "Student Dashboard")}
      subtitle={t("student.subtitle", "Personal cabinet with separate sections")}
      actions={<button className="button" onClick={() => setRefreshIndex((value) => value + 1)}>{t("common.refreshAll", "Refresh all")}</button>}
    >
      {error ? <div className="banner banner--error">{error}</div> : null}
      {loading ? <div className="empty-state">{t("common.loadingWorkspace", "Loading workspace...")}</div> : null}
      <RoleWorkspace sections={sections} initialSection="overview" />
    </AppShell>
  );
}
