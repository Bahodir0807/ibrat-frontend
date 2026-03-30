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
  const [activeSection, setActiveSection] = useState("overview");
  const [filters, setFilters] = useState({
    schedule: "",
    group: "",
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
  const loading = [scheduleQuery.isLoading, homeworkQuery.isLoading, gradesQuery.isLoading, attendanceQuery.isLoading, paymentsQuery.isLoading].some(Boolean);
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

  const filteredGroupHomework = useMemo(
    () =>
      homework.filter((row) => (
        matchesText(Array.isArray(row.tasks) ? row.tasks.join(", ") : "", filters.group) ||
        matchesText(formatDate(row.date), filters.group)
      )),
    [filters.group, homework],
  );

  const filteredGroupGrades = useMemo(
    () =>
      grades.filter((row) => (
        matchesText(row.subject, filters.group) ||
        matchesText(row.score, filters.group) ||
        matchesText(formatDate(row.date), filters.group)
      )),
    [filters.group, grades],
  );

  const filteredGroupAttendance = useMemo(
    () =>
      attendance.filter((row) => (
        matchesText(row.status, filters.group) ||
        matchesText(formatDate(row.date), filters.group)
      )),
    [attendance, filters.group],
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
        <StatStrip
          items={[
            { label: "Schedule", value: schedule.length },
            { label: "Homework", value: homework.length },
            { label: "Grades", value: grades.length },
            { label: "Attendance", value: attendance.length },
            { label: "Payments", value: payments.length },
          ]}
        />
      ),
    },
    {
      key: "groups",
      label: "Groups",
      note: "Homework, grades, attendance",
      description: "Everything related to your group and progress in one department.",
      render: () => (
        <div className="stack">
          <SectionCard title="Group progress" subtitle="Homework, grades and attendance in one filtered view">
            <ListToolbar
              value={filters.group}
              onChange={(value) => setFilters((current) => ({ ...current, group: value }))}
              placeholder="Search group progress by task, grade, status or date"
              summary={`${filteredGroupHomework.length + filteredGroupGrades.length + filteredGroupAttendance.length} records`}
            />
          </SectionCard>
          <div className="dashboard-grid dashboard-grid--dense">
            <SectionCard title="Homework" subtitle="From /homework/me">
              <DataTable
                rows={filteredGroupHomework}
                caption="Homework"
                pageSize={4}
                defaultSortKey="date"
                defaultSortDirection="desc"
                columns={[
                  { key: "date", label: "Date", render: (row) => formatDate(row.date), sortValue: (row) => row.date || "" },
                  { key: "tasks", label: "Tasks", render: (row) => (Array.isArray(row.tasks) ? row.tasks.join(", ") : "-"), sortValue: (row) => (Array.isArray(row.tasks) ? row.tasks.join(", ") : "") },
                ]}
              />
            </SectionCard>
            <SectionCard title="Grades" subtitle="From /grades/me">
              <DataTable
                rows={filteredGroupGrades}
                caption="Grades"
                pageSize={4}
                defaultSortKey="date"
                defaultSortDirection="desc"
                columns={[
                  { key: "subject", label: "Subject", sortValue: (row) => row.subject || "" },
                  { key: "score", label: "Score", sortValue: (row) => Number(row.score || 0) },
                  { key: "date", label: "Date", render: (row) => formatDate(row.date), sortValue: (row) => row.date || "" },
                ]}
              />
            </SectionCard>
            <SectionCard title="Attendance" subtitle="From /attendance/me">
              <DataTable
                rows={filteredGroupAttendance}
                caption="Attendance"
                pageSize={6}
                defaultSortKey="date"
                defaultSortDirection="desc"
                columns={[
                  { key: "date", label: "Date", render: (row) => formatDate(row.date), sortValue: (row) => row.date || "" },
                  { key: "status", label: "Status", sortValue: (row) => row.status || "" },
                ]}
              />
            </SectionCard>
          </div>
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
            caption="My schedule"
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
            caption="Payments"
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

  const currentSection = sections.find((section) => section.key === activeSection) || sections[0];

  return (
    <AppShell
      title={t("student.title", "Student Dashboard")}
      subtitle={t("student.subtitle", "Personal cabinet with separate sections")}
      sidebarSections={sections}
      activeSection={currentSection?.key}
      onSectionChange={setActiveSection}
      actions={<button className="button" type="button" onClick={() => queryClient.invalidateQueries({ queryKey: ["student"] })}>{t("common.refreshAll", "Refresh all")}</button>}
    >
      {error ? <div className="banner banner--error">{error}</div> : null}
      {loading ? <div className="empty-state">{t("common.loadingWorkspace", "Loading workspace...")}</div> : null}
      <RoleWorkspace section={currentSection} />
    </AppShell>
  );
}
