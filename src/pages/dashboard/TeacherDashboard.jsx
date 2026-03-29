import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, DataTable, SectionCard, StatStrip } from "../../components/AppShell";
import FormModal from "../../components/FormModal";
import ListToolbar from "../../components/ListToolbar";
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
import {
  formatDate,
  formatPerson,
  formatScheduleSlot,
  formatWeekday,
  matchesText,
  normalizeList,
  splitTasks,
} from "./helpers";
import { showErrorToast, showSuccessToast } from "../../lib/toast";

const notificationTypes = ["payment", "homework", "grades", "attendance", "general"];
const emptyAttendanceDraft = () => ({ userId: "", date: "", status: "present" });
const emptyHomeworkDraft = () => ({ userId: "", date: "", tasks: "" });
const emptyGradeDraft = () => ({ userId: "", subject: "", score: "" });
const emptyNotificationDraft = () => ({ userId: "", message: "", type: "general" });

export default function TeacherDashboard() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [studentSearch, setStudentSearch] = useState("");
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [selectedGradeUserId, setSelectedGradeUserId] = useState("");
  const [editingGradeId, setEditingGradeId] = useState("");
  const [editingGradeScore, setEditingGradeScore] = useState("");
  const [attendanceDraft, setAttendanceDraft] = useState(emptyAttendanceDraft);
  const [homeworkDraft, setHomeworkDraft] = useState(emptyHomeworkDraft);
  const [gradeDraft, setGradeDraft] = useState(emptyGradeDraft);
  const [notificationDraft, setNotificationDraft] = useState(emptyNotificationDraft);
  const [modalState, setModalState] = useState({
    attendance: false,
    homework: false,
    grades: false,
    notifications: false,
  });

  const studentsQuery = useQuery({
    queryKey: ["teacher", "students"],
    queryFn: async () => normalizeList(await usersApi.students()),
  });

  const scheduleQuery = useQuery({
    queryKey: ["teacher", "schedule"],
    queryFn: async () => normalizeList(await scheduleApi.mine()),
  });

  const gradesQuery = useQuery({
    queryKey: ["teacher", "grades", selectedGradeUserId],
    enabled: Boolean(selectedGradeUserId),
    queryFn: async () => normalizeList(await gradesApi.byUser(selectedGradeUserId)),
  });

  const students = studentsQuery.data || [];
  const schedule = scheduleQuery.data || [];
  const gradeRecords = gradesQuery.data || [];
  const loading = studentsQuery.isLoading || scheduleQuery.isLoading;
  const error =
    studentsQuery.error?.response?.data?.message ||
    studentsQuery.error?.message ||
    scheduleQuery.error?.response?.data?.message ||
    scheduleQuery.error?.message ||
    "";

  function closeModal(name) {
    setModalState((current) => ({ ...current, [name]: false }));
  }

  function withTeacherRefresh() {
    queryClient.invalidateQueries({ queryKey: ["teacher"] });
  }

  const attendanceMutation = useMutation({
    mutationFn: attendanceApi.create,
    onSuccess: () => {
      showSuccessToast("Attendance saved");
      setAttendanceDraft(emptyAttendanceDraft());
      closeModal("attendance");
      withTeacherRefresh();
    },
    onError: (submitError) => showErrorToast(submitError, "Failed to save attendance"),
  });

  const homeworkMutation = useMutation({
    mutationFn: homeworkApi.create,
    onSuccess: () => {
      showSuccessToast("Homework created");
      setHomeworkDraft(emptyHomeworkDraft());
      closeModal("homework");
      withTeacherRefresh();
    },
    onError: (submitError) => showErrorToast(submitError, "Failed to create homework"),
  });

  const gradeCreateMutation = useMutation({
    mutationFn: gradesApi.create,
    onSuccess: (_, payload) => {
      showSuccessToast("Grade created");
      setGradeDraft((current) => ({ ...emptyGradeDraft(), userId: current.userId || payload.userId || "" }));
      setSelectedGradeUserId(payload.userId || selectedGradeUserId);
      closeModal("grades");
      withTeacherRefresh();
      if (payload.userId) {
        queryClient.invalidateQueries({ queryKey: ["teacher", "grades", payload.userId] });
      }
    },
    onError: (submitError) => showErrorToast(submitError, "Failed to create grade"),
  });

  const gradeUpdateMutation = useMutation({
    mutationFn: ({ id, payload }) => gradesApi.update(id, payload),
    onSuccess: () => {
      showSuccessToast("Grade updated");
      setEditingGradeId("");
      setEditingGradeScore("");
      if (selectedGradeUserId) {
        queryClient.invalidateQueries({ queryKey: ["teacher", "grades", selectedGradeUserId] });
      }
    },
    onError: (submitError) => showErrorToast(submitError, "Failed to update grade"),
  });

  const notificationMutation = useMutation({
    mutationFn: notificationsApi.create,
    onSuccess: () => {
      showSuccessToast("Notification sent");
      setNotificationDraft(emptyNotificationDraft());
      closeModal("notifications");
    },
    onError: (submitError) => showErrorToast(submitError, "Failed to send notification"),
  });

  const filteredStudents = useMemo(
    () =>
      students.filter((row) => (
        matchesText(row.username, studentSearch) ||
        matchesText(formatPerson(row), studentSearch) ||
        matchesText(row.phoneNumber, studentSearch)
      )),
    [studentSearch, students],
  );

  const filteredSchedule = useMemo(
    () =>
      schedule.filter((row) => (
        matchesText(row.course?.name, scheduleSearch) ||
        matchesText(row.group?.name, scheduleSearch) ||
        matchesText(row.room?.name, scheduleSearch) ||
        matchesText(formatWeekday(row.weekday || row.date), scheduleSearch)
      )),
    [schedule, scheduleSearch],
  );

  const selectedStudentName =
    students.find((student) => student._id === selectedGradeUserId)?.username ||
    formatPerson(students.find((student) => student._id === selectedGradeUserId));

  const sections = [
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
              { label: "Selected student", value: selectedStudentName || "-" },
              { label: "Grade records", value: gradeRecords.length },
            ]}
          />
          <SectionCard title="My schedule" subtitle="Current teacher schedule">
            <ListToolbar
              value={scheduleSearch}
              onChange={setScheduleSearch}
              placeholder="Search schedule by course, group, room or day"
              summary={`${filteredSchedule.length} records`}
            />
            <DataTable
              rows={filteredSchedule}
              pageSize={5}
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
          <ListToolbar
            value={studentSearch}
            onChange={setStudentSearch}
            placeholder="Search students by name, username or phone"
            summary={`${filteredStudents.length} records`}
          />
          <DataTable
            rows={filteredStudents}
            pageSize={7}
            defaultSortKey="username"
            columns={[
              { key: "username", label: "Username", sortValue: (row) => row.username || "" },
              { key: "name", label: "Name", render: (row) => formatPerson(row), sortValue: (row) => formatPerson(row) },
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
        <SectionCard
          title="Mark attendance"
          subtitle="One record per request"
          action={<button className="button" type="button" onClick={() => setModalState((current) => ({ ...current, attendance: true }))}>New attendance</button>}
        >
          <p className="muted">Attendance stays in a single-purpose modal with a student, date and status only.</p>
        </SectionCard>
      ),
    },
    {
      key: "homework",
      label: "Homework",
      note: "Assignments",
      description: "Assign homework to one student at a time.",
      render: () => (
        <SectionCard
          title="Assign homework"
          subtitle="Split tasks by line"
          action={<button className="button" type="button" onClick={() => setModalState((current) => ({ ...current, homework: true }))}>New homework</button>}
        >
          <p className="muted">Homework is created in a focused modal to keep the teaching area compact.</p>
        </SectionCard>
      ),
    },
    {
      key: "grades",
      label: "Grades",
      note: "Assessment",
      description: "Create and update grade entries for a selected student.",
      render: () => (
        <div className="stack">
          <SectionCard
            title="Add grade"
            subtitle="Direct scoring input"
            action={<button className="button" type="button" onClick={() => setModalState((current) => ({ ...current, grades: true }))}>New grade</button>}
          >
            <p className="muted">Create a grade in the modal, then review and edit the history below for the selected student.</p>
          </SectionCard>
          <SectionCard title="Student grades" subtitle="Editable score history for selected student">
            <ListToolbar
              value=""
              onChange={() => {}}
              showSearch={false}
              summary={selectedGradeUserId ? `${gradeRecords.length} records` : "Select a student to load grades"}
              action={(
                <select
                  value={selectedGradeUserId}
                  onChange={(event) => {
                    const nextUserId = event.target.value;
                    setSelectedGradeUserId(nextUserId);
                    setGradeDraft((current) => ({ ...current, userId: nextUserId }));
                  }}
                >
                  <option value="">Select student</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>{formatPerson(student)}</option>
                  ))}
                </select>
              )}
            />
            {gradesQuery.isLoading && selectedGradeUserId ? <div className="empty-state">Loading grades...</div> : null}
            <DataTable
              rows={selectedGradeUserId ? gradeRecords : []}
              pageSize={6}
              defaultSortKey="date"
              defaultSortDirection="desc"
              emptyText={selectedGradeUserId ? "No grades yet" : "Select a student to load grades"}
              columns={[
                { key: "subject", label: "Subject" },
                { key: "score", label: "Score", sortValue: (row) => Number(row.score || 0) },
                { key: "date", label: "Date", render: (row) => formatDate(row.date), sortValue: (row) => row.date || "" },
                {
                  key: "actions",
                  label: "Actions",
                  sortable: false,
                  render: (row) => (
                    editingGradeId === row._id ? (
                      <div className="form-row">
                        <input
                          type="number"
                          min="0"
                          value={editingGradeScore}
                          onChange={(event) => setEditingGradeScore(event.target.value)}
                          placeholder="Score"
                        />
                        <button
                          className="button button--ghost"
                          type="button"
                          disabled={gradeUpdateMutation.isPending}
                          onClick={() => {
                            gradeUpdateMutation.mutate({
                              id: row._id,
                              payload: { score: Number(editingGradeScore) },
                            });
                          }}
                        >
                          Save
                        </button>
                        <button
                          className="button button--ghost"
                          type="button"
                          onClick={() => {
                            setEditingGradeId("");
                            setEditingGradeScore("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="button button--ghost"
                        type="button"
                        onClick={() => {
                          setEditingGradeId(row._id);
                          setEditingGradeScore(String(row.score ?? ""));
                        }}
                      >
                        Edit
                      </button>
                    )
                  ),
                },
              ]}
            />
          </SectionCard>
        </div>
      ),
    },
    {
      key: "notifications",
      label: "Notifications",
      note: "One user",
      description: "Send a direct Telegram notification through the backend.",
      render: () => (
        <SectionCard
          title="Send notification"
          subtitle="Admin/teacher notification endpoint"
          action={<button className="button" type="button" onClick={() => setModalState((current) => ({ ...current, notifications: true }))}>New notification</button>}
        >
          <p className="muted">Notifications are composed in a dedicated modal so the main workspace stays readable.</p>
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
          <ListToolbar
            value={scheduleSearch}
            onChange={setScheduleSearch}
            placeholder="Search schedule by course, group, room or day"
            summary={`${filteredSchedule.length} records`}
          />
          <DataTable
            rows={filteredSchedule}
            pageSize={7}
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
  ];

  return (
    <AppShell
      title={t("teacher.title", "Teacher Dashboard")}
      subtitle={t("teacher.subtitle", "Attendance, homework, grades, notifications and schedule")}
      actions={(
        <button
          className="button"
          type="button"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["teacher"] })}
        >
          {t("common.refreshAll", "Refresh all")}
        </button>
      )}
    >
      {error ? <div className="banner banner--error">{error}</div> : null}
      {loading ? <div className="empty-state">{t("common.loadingWorkspace", "Loading workspace...")}</div> : null}
      <RoleWorkspace sections={sections} initialSection="overview" />

      <FormModal
        open={modalState.attendance}
        title="Mark attendance"
        subtitle="One record per request"
        onClose={() => closeModal("attendance")}
      >
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            attendanceMutation.mutate(attendanceDraft);
          }}
        >
          <div className="form-row">
            <select value={attendanceDraft.userId} onChange={(event) => setAttendanceDraft((current) => ({ ...current, userId: event.target.value }))}>
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>{formatPerson(student)}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={attendanceDraft.date}
              onChange={(event) => setAttendanceDraft((current) => ({ ...current, date: event.target.value }))}
            />
            <select value={attendanceDraft.status} onChange={(event) => setAttendanceDraft((current) => ({ ...current, status: event.target.value }))}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>
          <button className="button" type="submit" disabled={attendanceMutation.isPending}>
            {attendanceMutation.isPending ? "Saving..." : "Save attendance"}
          </button>
        </form>
      </FormModal>

      <FormModal
        open={modalState.homework}
        title="Assign homework"
        subtitle="Split tasks by line"
        onClose={() => closeModal("homework")}
      >
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            homeworkMutation.mutate({ ...homeworkDraft, tasks: splitTasks(homeworkDraft.tasks) });
          }}
        >
          <div className="form-row">
            <select value={homeworkDraft.userId} onChange={(event) => setHomeworkDraft((current) => ({ ...current, userId: event.target.value }))}>
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>{formatPerson(student)}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={homeworkDraft.date}
              onChange={(event) => setHomeworkDraft((current) => ({ ...current, date: event.target.value }))}
            />
          </div>
          <textarea
            value={homeworkDraft.tasks}
            onChange={(event) => setHomeworkDraft((current) => ({ ...current, tasks: event.target.value }))}
            placeholder={"Task 1\nTask 2"}
          />
          <button className="button" type="submit" disabled={homeworkMutation.isPending}>
            {homeworkMutation.isPending ? "Saving..." : "Create homework"}
          </button>
        </form>
      </FormModal>

      <FormModal
        open={modalState.grades}
        title="Add grade"
        subtitle="Direct scoring input"
        onClose={() => closeModal("grades")}
      >
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            gradeCreateMutation.mutate({ ...gradeDraft, score: Number(gradeDraft.score) });
          }}
        >
          <div className="form-row">
            <select
              value={gradeDraft.userId}
              onChange={(event) => {
                const nextUserId = event.target.value;
                setGradeDraft((current) => ({ ...current, userId: nextUserId }));
                setSelectedGradeUserId(nextUserId);
              }}
            >
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>{formatPerson(student)}</option>
              ))}
            </select>
            <input
              value={gradeDraft.subject}
              onChange={(event) => setGradeDraft((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Subject"
            />
            <input
              type="number"
              min="0"
              value={gradeDraft.score}
              onChange={(event) => setGradeDraft((current) => ({ ...current, score: event.target.value }))}
              placeholder="Score"
            />
          </div>
          <button className="button" type="submit" disabled={gradeCreateMutation.isPending}>
            {gradeCreateMutation.isPending ? "Saving..." : "Create grade"}
          </button>
        </form>
      </FormModal>

      <FormModal
        open={modalState.notifications}
        title="Send notification"
        subtitle="Admin/teacher notification endpoint"
        onClose={() => closeModal("notifications")}
      >
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            notificationMutation.mutate(notificationDraft);
          }}
        >
          <div className="form-row">
            <select value={notificationDraft.userId} onChange={(event) => setNotificationDraft((current) => ({ ...current, userId: event.target.value }))}>
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>{formatPerson(student)}</option>
              ))}
            </select>
            <select value={notificationDraft.type} onChange={(event) => setNotificationDraft((current) => ({ ...current, type: event.target.value }))}>
              {notificationTypes.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <textarea
            value={notificationDraft.message}
            onChange={(event) => setNotificationDraft((current) => ({ ...current, message: event.target.value }))}
            placeholder="Message text"
          />
          <button className="button" type="submit" disabled={notificationMutation.isPending}>
            {notificationMutation.isPending ? "Sending..." : "Send notification"}
          </button>
        </form>
      </FormModal>
    </AppShell>
  );
}
