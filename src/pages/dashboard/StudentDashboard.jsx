import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, DataTable, SectionCard, StatStrip } from "../../components/AppShell";
import ListToolbar from "../../components/ListToolbar";
import RoleWorkspace from "../../components/RoleWorkspace";
import { attendanceApi, gradesApi, homeworkApi, paymentsApi, scheduleApi } from "../../api/resources";
import { formatDate, formatScheduleSlot, formatWeekday, matchesText, normalizeList } from "./helpers";
import { useI18n } from "../../context/I18nContext";

export default function StudentDashboard() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    schedule: "",
    homework: "",
    grades: "",
    attendance: "all",
    payments: "all",
  });

  const scheduleQuery = useQuery({
    queryKey: ["student", "schedule"],
    queryFn: async () => normalizeList(await scheduleApi.mine()),
  });
  const homeworkQuery = useQuery({
    queryKey: ["student", "homework"],
    queryFn: async () => normalizeList(await homeworkApi.mine()),
  });
  const gradesQuery = useQuery({
    queryKey: ["student", "grades"],
    queryFn: async () => normalizeList(await gradesApi.mine()),
  });
  const attendanceQuery = useQuery({
    queryKey: ["student", "attendance"],
    queryFn: async () => normalizeList(await attendanceApi.mine()),
  });
  const paymentsQuery = useQuery({
    queryKey: ["student", "payments"],
    queryFn: async () => normalizeList(await paymentsApi.mine()),
  });

  const schedule = scheduleQuery.data || [];
  const homework = homeworkQuery.data || [];
  const grades = gradesQuery.data || [];
  const attendance = attendanceQuery.data || [];
  const payments = paymentsQuery.data || [];
  const loading = [
    scheduleQuery.isLoading,
    homeworkQuery.isLoading,
    gradesQuery.isLoading,
    attendanceQuery.isLoading,
    paymentsQuery.isLoading,
  ].some(Boolean);
  const error =
    scheduleQuery.error?.response?.data?.message ||
    scheduleQuery.error?.message ||
    homeworkQuery.error?.response?.data?.message ||
    homeworkQuery.error?.message ||
    gradesQuery.error?.response?.data?.message ||
    gradesQuery.error?.message ||
    attendanceQuery.error?.response?.data?.message ||
    attendanceQuery.error?.message ||
    paymentsQuery.error?.response?.data?.message ||
    paymentsQuery.error?.message ||
    "";

  const filteredSchedule = useMemo(
    () =>
      schedule.filter((row) => (
        matchesText(row.course?.name, filters.schedule) ||
        matchesText(row.group?.name, filters.schedule) ||
        matchesText(row.room?.name, filters.schedule) ||
        matchesText(formatWeekday(row.weekday || row.date), filters.schedule)
      )),
    [filters.schedule, schedule],
  );

  const filteredHomework = useMemo(
    () =>
      homework.filter((row) => (
        matchesText(Array.isArray(row.tasks) ? row.tasks.join(", ") : "", filters.homework) ||
        matchesText(formatDate(row.date), filters.homework)
      )),
    [filters.homework, homework],
  );

  const filteredGrades = useMemo(
    () =>
      grades.filter((row) => (
        matchesText(row.subject, filters.grades) ||
        matchesText(row.score, filters.grades) ||
        matchesText(formatDate(row.date), filters.grades)
      )),
    [filters.grades, grades],
  );

  const filteredAttendance = useMemo(
    () =>
      attendance.filter((row) => (
        filters.attendance === "all" ? true : row.status === filters.attendance
      )),
    [attendance, filters.attendance],
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((row) => {
        if (filters.payments === "all") return true;
        return filters.payments === "confirmed" ? row.isConfirmed : !row.isConfirmed;
      }),
    [filters.payments, payments],
  );

  const sections = [
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
          <ListToolbar
            value={filters.schedule}
            onChange={(value) => setFilters((current) => ({ ...current, schedule: value }))}
            placeholder="Search schedule by course, group, room or day"
            summary={`${filteredSchedule.length} records`}
          />
          <DataTable
            rows={filteredSchedule}
            pageSize={6}
            defaultSortKey="weekday"
            columns={[
              { key: "course", label: "Course", render: (row) => row.course?.name || "-", sortValue: (row) => row.course?.name || "" },
              { key: "group", label: "Group", render: (row) => row.group?.name || "-", sortValue: (row) => row.group?.name || "" },
              { key: "room", label: "Room", render: (row) => row.room?.name || "-", sortValue: (row) => row.room?.name || "" },
              { key: "weekday", label: "Day", render: (row) => formatWeekday(row.weekday || row.date), sortValue: (row) => formatWeekday(row.weekday || row.date) },
              { key: "time", label: "Time", render: (row) => formatScheduleSlot(row), sortValue: (row) => formatScheduleSlot(row) },
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
          <ListToolbar
            value={filters.homework}
            onChange={(value) => setFilters((current) => ({ ...current, homework: value }))}
            placeholder="Search homework by task or date"
            summary={`${filteredHomework.length} records`}
          />
          <DataTable
            rows={filteredHomework}
            pageSize={6}
            defaultSortKey="date"
            defaultSortDirection="desc"
            columns={[
              { key: "date", label: "Date", render: (row) => formatDate(row.date), sortValue: (row) => row.date || "" },
              { key: "tasks", label: "Tasks", render: (row) => (Array.isArray(row.tasks) ? row.tasks.join(", ") : "-"), sortValue: (row) => (Array.isArray(row.tasks) ? row.tasks.join(", ") : "") },
              { key: "completed", label: "Done", render: (row) => (row.completed ? "Yes" : "No"), sortValue: (row) => (row.completed ? 1 : 0) },
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
          <ListToolbar
            value={filters.grades}
            onChange={(value) => setFilters((current) => ({ ...current, grades: value }))}
            placeholder="Search grades by subject, score or date"
            summary={`${filteredGrades.length} records`}
          />
          <DataTable
            rows={filteredGrades}
            pageSize={6}
            defaultSortKey="date"
            defaultSortDirection="desc"
            columns={[
              { key: "subject", label: "Subject", sortValue: (row) => row.subject || "" },
              { key: "score", label: "Score", sortValue: (row) => Number(row.score || 0) },
              { key: "date", label: "Date", render: (row) => formatDate(row.date), sortValue: (row) => row.date || "" },
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
          <ListToolbar
            showSearch={false}
            value=""
            onChange={() => {}}
            summary={`${filteredAttendance.length} records`}
            action={(
              <select value={filters.attendance} onChange={(event) => setFilters((current) => ({ ...current, attendance: event.target.value }))}>
                <option value="all">All statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            )}
          />
          <DataTable
            rows={filteredAttendance}
            pageSize={6}
            defaultSortKey="date"
            defaultSortDirection="desc"
            columns={[
              { key: "date", label: "Date", render: (row) => formatDate(row.date), sortValue: (row) => row.date || "" },
              { key: "status", label: "Status", sortValue: (row) => row.status || "" },
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
          <ListToolbar
            showSearch={false}
            value=""
            onChange={() => {}}
            summary={`${filteredPayments.length} records`}
            action={(
              <select value={filters.payments} onChange={(event) => setFilters((current) => ({ ...current, payments: event.target.value }))}>
                <option value="all">All payments</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
              </select>
            )}
          />
          <DataTable
            rows={filteredPayments}
            pageSize={6}
            defaultSortKey="paidAt"
            defaultSortDirection="desc"
            columns={[
              { key: "amount", label: "Amount", sortValue: (row) => Number(row.amount || 0) },
              { key: "paidAt", label: "Paid at", render: (row) => formatDate(row.paidAt), sortValue: (row) => row.paidAt || "" },
              { key: "isConfirmed", label: "Confirmed", render: (row) => (row.isConfirmed ? "Yes" : "Pending"), sortValue: (row) => (row.isConfirmed ? 1 : 0) },
            ]}
          />
        </SectionCard>
      ),
    },
  ];

  return (
    <AppShell
      title={t("student.title", "Student Dashboard")}
      subtitle={t("student.subtitle", "Personal cabinet with separate sections")}
      actions={(
        <button
          className="button"
          type="button"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["student"] })}
        >
          {t("common.refreshAll", "Refresh all")}
        </button>
      )}
    >
      {error ? <div className="banner banner--error">{error}</div> : null}
      {loading ? <div className="empty-state">{t("common.loadingWorkspace", "Loading workspace...")}</div> : null}
      <RoleWorkspace sections={sections} initialSection="overview" />
    </AppShell>
  );
}
