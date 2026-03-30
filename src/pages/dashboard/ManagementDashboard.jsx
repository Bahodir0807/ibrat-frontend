import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, DataTable, SectionCard, StatStrip } from "../../components/AppShell";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormModal from "../../components/FormModal";
import ListToolbar from "../../components/ListToolbar";
import RoleWorkspace from "../../components/RoleWorkspace";
import { useI18n } from "../../context/I18nContext";
import {
  coursesApi,
  groupsApi,
  paymentsApi,
  phoneRequestsApi,
  rolesApi,
  roomsApi,
  scheduleApi,
  statisticsApi,
  usersApi,
} from "../../api/resources";
import {
  WEEKDAY_OPTIONS,
  buildSchedulePayload,
  formatDate,
  formatPerson,
  formatScheduleSlot,
  formatWeekday,
  matchesText,
  normalizeList,
} from "./helpers";
import { showErrorToast, showSuccessToast } from "../../lib/toast";

const roleOptions = ["guest", "student", "teacher", "admin", "owner", "panda"];
const roomTypes = ["classroom", "lab", "office", "meeting"];
const EMPTY_VALUE = "-";

const featurePresets = {
  owner: { roles: true, statistics: true, phoneRequests: true },
  admin: { roles: false, statistics: true, phoneRequests: false },
  panda: { roles: false, statistics: false, phoneRequests: true },
};

const emptyUserDraft = () => ({ username: "", password: "", role: "guest" });
const emptyCourseDraft = () => ({ name: "", description: "", price: "", teacherId: "" });
const emptyGroupDraft = () => ({ name: "", course: "", teacher: "", students: [] });
const emptyRoomDraft = () => ({ name: "", capacity: "", type: "classroom", description: "" });
const emptyScheduleDraft = () => ({ course: "", room: "", group: "", weekday: "monday", timeStart: "", timeEnd: "", teacher: "" });
const emptyPaymentDraft = () => ({ student: "", courseId: "", paidAt: "" });
const emptyRoleDraft = () => ({ name: "", permissions: "" });
const emptyStatDraft = () => ({ type: "", value: "", date: "" });
const emptyPhoneRequestDraft = () => ({ phone: "", name: "", telegramId: "" });

export default function ManagementDashboard({ title, subtitle, variant = "admin" }) {
  const { t } = useI18n();
  const tr = (value) => t(value, value);
  const queryClient = useQueryClient();
  const features = featurePresets[variant] || featurePresets.admin;
  const [activeSection, setActiveSection] = useState("overview");

  const [editingUserId, setEditingUserId] = useState("");
  const [editingCourseId, setEditingCourseId] = useState("");
  const [editingGroupId, setEditingGroupId] = useState("");
  const [editingRoomId, setEditingRoomId] = useState("");
  const [editingScheduleId, setEditingScheduleId] = useState("");
  const [editingRoleName, setEditingRoleName] = useState("");
  const [confirmState, setConfirmState] = useState({ open: false, title: "", description: "", onConfirm: null });
  const [modalState, setModalState] = useState({
    users: false,
    courses: false,
    groups: false,
    rooms: false,
    schedule: false,
    roles: false,
  });
  const [filters, setFilters] = useState({
    users: "",
    courses: "",
    groups: "",
    rooms: "",
    schedule: "",
    payments: "",
    roles: "",
    phoneRequests: "",
  });

  const [userDraft, setUserDraft] = useState(emptyUserDraft);
  const [courseDraft, setCourseDraft] = useState(emptyCourseDraft);
  const [groupDraft, setGroupDraft] = useState(emptyGroupDraft);
  const [roomDraft, setRoomDraft] = useState(emptyRoomDraft);
  const [scheduleDraft, setScheduleDraft] = useState(emptyScheduleDraft);
  const [paymentDraft, setPaymentDraft] = useState(emptyPaymentDraft);
  const [roleDraft, setRoleDraft] = useState(emptyRoleDraft);
  const [statDraft, setStatDraft] = useState(emptyStatDraft);
  const [phoneRequestDraft, setPhoneRequestDraft] = useState(emptyPhoneRequestDraft);

  const { data: dataset = {
    users: [],
    students: [],
    courses: [],
    groups: [],
    rooms: [],
    schedule: [],
    payments: [],
    roles: [],
    statistics: [],
    phoneRequests: [],
  }, isLoading: loading, error, refetch } = useQuery({
    queryKey: ["management-dashboard", variant, features.roles, features.statistics, features.phoneRequests],
    queryFn: async () => {
      const requests = [
        usersApi.list(),
        usersApi.students(),
        coursesApi.list(),
        groupsApi.list(),
        roomsApi.list(),
        scheduleApi.list(),
        paymentsApi.list(),
        features.roles ? rolesApi.list() : Promise.resolve([]),
        features.statistics ? statisticsApi.list() : Promise.resolve([]),
        features.phoneRequests ? phoneRequestsApi.listPending() : Promise.resolve([]),
      ];
      const [users, students, courses, groups, rooms, schedule, payments, roles, statistics, phoneRequests] =
        await Promise.all(requests);

      return {
        users: normalizeList(users),
        students: normalizeList(students),
        courses: normalizeList(courses),
        groups: normalizeList(groups),
        rooms: normalizeList(rooms),
        schedule: normalizeList(schedule),
        payments: normalizeList(payments),
        roles: normalizeList(roles),
        statistics: normalizeList(statistics),
        phoneRequests: normalizeList(phoneRequests),
      };
    },
  });

  function refresh() {
    void refetch();
  }

  async function execute(action, successReset) {
    try {
      await action();
      successReset?.();
      showSuccessToast(tr("Saved successfully"));
      await queryClient.invalidateQueries({ queryKey: ["management-dashboard"] });
    } catch (submitError) {
      showErrorToast(submitError, tr("Action failed"));
    }
  }

  function removeItem(label, action) {
    setConfirmState({
      open: true,
      title: `${t("common.delete", "Delete")}: ${label}`,
      description: t("common.deleteConfirm", "This action cannot be undone."),
      onConfirm: async () => {
        await execute(action);
        setConfirmState({ open: false, title: "", description: "", onConfirm: null });
      },
    });
  }

  function startUserEdit(user) {
    setEditingUserId(user._id);
    setUserDraft({ username: user.username || "", password: "", role: user.role || "guest" });
    setModalState((current) => ({ ...current, users: true }));
  }

  function cancelUserEdit() {
    setEditingUserId("");
    setUserDraft(emptyUserDraft());
    setModalState((current) => ({ ...current, users: false }));
  }

  function submitUser(event) {
    event.preventDefault();
    if (editingUserId) {
      const payload = { username: userDraft.username, role: userDraft.role };
      if (userDraft.password.trim()) payload.password = userDraft.password;
      execute(() => usersApi.update(editingUserId, payload), cancelUserEdit);
      return;
    }
    execute(() => usersApi.create(userDraft), () => {
      setUserDraft(emptyUserDraft());
      setModalState((current) => ({ ...current, users: false }));
    });
  }

  function startCourseEdit(course) {
    setEditingCourseId(course._id);
    setCourseDraft({
      name: course.name || "",
      description: course.description || "",
      price: course.price ?? "",
      teacherId: course.teacherId?._id || "",
    });
    setModalState((current) => ({ ...current, courses: true }));
  }

  function cancelCourseEdit() {
    setEditingCourseId("");
    setCourseDraft(emptyCourseDraft());
    setModalState((current) => ({ ...current, courses: false }));
  }

  function submitCourse(event) {
    event.preventDefault();
    const payload = {
      name: courseDraft.name,
      description: courseDraft.description,
      price: Number(courseDraft.price),
      teacherId: courseDraft.teacherId || undefined,
    };
    if (editingCourseId) {
      execute(() => coursesApi.update(editingCourseId, payload), cancelCourseEdit);
      return;
    }
    execute(() => coursesApi.create(payload), () => {
      setCourseDraft(emptyCourseDraft());
      setModalState((current) => ({ ...current, courses: false }));
    });
  }

  function startGroupEdit(group) {
    setEditingGroupId(group._id);
    setGroupDraft({
      name: group.name || "",
      course: group.course?._id || "",
      teacher: group.teacher?._id || "",
      students: Array.isArray(group.students) ? group.students.map((item) => item._id) : [],
    });
    setModalState((current) => ({ ...current, groups: true }));
  }

  function cancelGroupEdit() {
    setEditingGroupId("");
    setGroupDraft(emptyGroupDraft());
    setModalState((current) => ({ ...current, groups: false }));
  }

  function submitGroup(event) {
    event.preventDefault();
    if (editingGroupId) {
      execute(() => groupsApi.update(editingGroupId, groupDraft), cancelGroupEdit);
      return;
    }
    execute(() => groupsApi.create(groupDraft), () => {
      setGroupDraft(emptyGroupDraft());
      setModalState((current) => ({ ...current, groups: false }));
    });
  }

  function startRoomEdit(room) {
    setEditingRoomId(room._id);
    setRoomDraft({
      name: room.name || "",
      capacity: room.capacity ?? "",
      type: room.type || "classroom",
      description: room.description || "",
    });
    setModalState((current) => ({ ...current, rooms: true }));
  }

  function cancelRoomEdit() {
    setEditingRoomId("");
    setRoomDraft(emptyRoomDraft());
    setModalState((current) => ({ ...current, rooms: false }));
  }

  function submitRoom(event) {
    event.preventDefault();
    const payload = {
      name: roomDraft.name,
      capacity: Number(roomDraft.capacity),
      type: roomDraft.type,
      description: roomDraft.description,
    };
    if (editingRoomId) {
      execute(() => roomsApi.update(editingRoomId, payload), cancelRoomEdit);
      return;
    }
    execute(() => roomsApi.create(payload), () => {
      setRoomDraft(emptyRoomDraft());
      setModalState((current) => ({ ...current, rooms: false }));
    });
  }

  function startScheduleEdit(item) {
    const startValue = String(item.timeStart || "");
    const endValue = String(item.timeEnd || "");
    setEditingScheduleId(item._id);
    setScheduleDraft({
      course: item.course?._id || "",
      room: item.room?._id || "",
      group: item.group?._id || "",
      weekday: WEEKDAY_OPTIONS.find((entry) => entry.label === formatWeekday(item.weekday || item.date))?.value || "monday",
      timeStart: /^\d{2}:\d{2}$/.test(startValue) ? startValue : new Date(startValue).toISOString().slice(11, 16),
      timeEnd: /^\d{2}:\d{2}$/.test(endValue) ? endValue : new Date(endValue).toISOString().slice(11, 16),
      teacher: item.teacher?._id || "",
    });
    setModalState((current) => ({ ...current, schedule: true }));
  }

  function cancelScheduleEdit() {
    setEditingScheduleId("");
    setScheduleDraft(emptyScheduleDraft());
    setModalState((current) => ({ ...current, schedule: false }));
  }

  function submitSchedule(event) {
    event.preventDefault();
    const payload = buildSchedulePayload(scheduleDraft);
    if (editingScheduleId) {
      execute(() => scheduleApi.update(editingScheduleId, payload), cancelScheduleEdit);
      return;
    }
    execute(() => scheduleApi.create(payload), () => {
      setScheduleDraft(emptyScheduleDraft());
      setModalState((current) => ({ ...current, schedule: false }));
    });
  }

  function startRoleEdit(role) {
    setEditingRoleName(role.name);
    setRoleDraft({
      name: role.name || "",
      permissions: Array.isArray(role.permissions) ? role.permissions.join(", ") : "",
    });
    setModalState((current) => ({ ...current, roles: true }));
  }

  function cancelRoleEdit() {
    setEditingRoleName("");
    setRoleDraft(emptyRoleDraft());
    setModalState((current) => ({ ...current, roles: false }));
  }

  function submitRole(event) {
    event.preventDefault();
    const payload = {
      name: roleDraft.name,
      permissions: roleDraft.permissions.split(",").map((item) => item.trim()).filter(Boolean),
    };
    if (editingRoleName) {
      execute(() => rolesApi.update(editingRoleName, payload), cancelRoleEdit);
      return;
    }
    execute(() => rolesApi.create(payload), () => {
      setRoleDraft(emptyRoleDraft());
      setModalState((current) => ({ ...current, roles: false }));
    });
  }

  const filteredUsers = dataset.users.filter((row) => (
    matchesText(row.username, filters.users) ||
    matchesText(formatPerson(row), filters.users) ||
    matchesText(row.role, filters.users)
  ));

  const filteredCourses = dataset.courses.filter((row) => (
    matchesText(row.name, filters.courses) ||
    matchesText(row.description, filters.courses) ||
    matchesText(formatPerson(row.teacherId), filters.courses)
  ));

  const filteredGroups = dataset.groups.filter((row) => (
    matchesText(row.name, filters.groups) ||
    matchesText(row.course?.name, filters.groups) ||
    matchesText(formatPerson(row.teacher), filters.groups)
  ));

  const filteredRooms = dataset.rooms.filter((row) => (
    matchesText(row.name, filters.rooms) ||
    matchesText(row.type, filters.rooms) ||
    matchesText(row.description, filters.rooms)
  ));

  const filteredSchedule = dataset.schedule.filter((row) => (
    matchesText(row.course?.name, filters.schedule) ||
    matchesText(formatPerson(row.teacher), filters.schedule) ||
    matchesText(row.group?.name, filters.schedule) ||
    matchesText(row.room?.name, filters.schedule) ||
    matchesText(formatWeekday(row.weekday || row.date), filters.schedule)
  ));

  const filteredPayments = dataset.payments.filter((row) => (
    matchesText(formatPerson(row.student), filters.payments) ||
    matchesText(row.course?.name, filters.payments) ||
    matchesText(row.amount, filters.payments)
  ));

  const filteredRoles = dataset.roles.filter((row) => (
    matchesText(row.name, filters.roles) ||
    matchesText(Array.isArray(row.permissions) ? row.permissions.join(", ") : "", filters.roles)
  ));

  const filteredPhoneRequests = dataset.phoneRequests.filter((row) => (
    matchesText(row.name, filters.phoneRequests) ||
    matchesText(row.phone, filters.phoneRequests) ||
    matchesText(row.telegramId, filters.phoneRequests)
  ));

  const sections = [
    {
      key: "overview",
      label: "Overview",
      note: "Whole workspace",
      description: "Cross-module summary of operational entities.",
      render: () => (
        <div className="stack">
          <StatStrip
            items={[
              { label: "Users", value: dataset.users.length },
              { label: "Students", value: dataset.students.length },
              { label: "Courses", value: dataset.courses.length },
              { label: "Groups", value: dataset.groups.length },
              { label: "Rooms", value: dataset.rooms.length },
              { label: "Payments", value: dataset.payments.length },
            ]}
          />
          <div className="dashboard-grid dashboard-grid--dense">
            <SectionCard title="Latest schedule" subtitle="Upcoming entries">
              <DataTable
                rows={dataset.schedule.slice(0, 5)}
                columns={[
                  { key: "course", label: "Course", render: (row) => row.course?.name || EMPTY_VALUE },
                  { key: "teacher", label: "Teacher", render: (row) => formatPerson(row.teacher) },
                  { key: "group", label: "Group", render: (row) => row.group?.name || EMPTY_VALUE },
                  { key: "weekday", label: "Day", render: (row) => formatWeekday(row.weekday || row.date) },
                  { key: "time", label: "Time", render: (row) => formatScheduleSlot(row) },
                ]}
              />
            </SectionCard>
            <SectionCard title="Recent payments" subtitle="Latest financial events">
              <DataTable
                rows={dataset.payments.slice(0, 5)}
                columns={[
                  { key: "student", label: "Student", render: (row) => formatPerson(row.student) },
                  { key: "amount", label: "Amount" },
                  { key: "isConfirmed", label: "Status", render: (row) => (row.isConfirmed ? tr("Confirmed") : tr("Pending")) },
                ]}
              />
            </SectionCard>
          </div>
        </div>
      ),
    },
    {
      key: "users",
      label: "Users",
      note: "Accounts and roles",
      description: "Create users and manage role assignments.",
      render: () => (
        <div className="stack">
          <SectionCard
            title="Directory"
            subtitle="Manage existing users"
            action={<button className="button" onClick={() => { setEditingUserId(""); setUserDraft(emptyUserDraft()); setModalState((current) => ({ ...current, users: true })); }}>{tr("Create user")}</button>}
          >
            <ListToolbar
              value={filters.users}
              onChange={(value) => setFilters((current) => ({ ...current, users: value }))}
              placeholder={tr("Search users by name, username or role")}
              summary={`${filteredUsers.length} records`}
            />
            <DataTable
              rows={filteredUsers}
              pageSize={7}
              defaultSortKey="username"
              columns={[
                { key: "username", label: "Username", sortValue: (row) => row.username || "" },
                { key: "person", label: "Name", render: (row) => formatPerson(row), sortValue: (row) => formatPerson(row) },
                { key: "role", label: "Role" },
                {
                  key: "changeRole",
                  label: "Access",
                  sortable: false,
                  render: (row) => (
                    <select value={row.role} onChange={(e) => execute(() => usersApi.updateRole(row._id, e.target.value))}>
                      {roleOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  sortable: false,
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => startUserEdit(row)}>{tr("Edit")}</button>
                      <button className="button button--ghost" onClick={() => removeItem(row.username || tr("User"), () => usersApi.remove(row._id))}>{tr("Delete")}</button>
                    </div>
                  ),
                },
              ]}
            />
          </SectionCard>
        </div>
      ),
    },
    {
      key: "courses",
      label: "Courses",
      note: "Curriculum",
      description: "Create, update and remove courses.",
      render: () => (
        <div className="stack">
          <SectionCard
            title="Course list"
            subtitle="Current course catalog"
            action={<button className="button" onClick={() => { setEditingCourseId(""); setCourseDraft(emptyCourseDraft()); setModalState((current) => ({ ...current, courses: true })); }}>{tr("Create course")}</button>}
          >
            <ListToolbar
              value={filters.courses}
              onChange={(value) => setFilters((current) => ({ ...current, courses: value }))}
              placeholder={tr("Search courses by title, description or teacher")}
              summary={`${filteredCourses.length} records`}
            />
            <DataTable
              rows={filteredCourses}
              pageSize={6}
              defaultSortKey="name"
              columns={[
                { key: "name", label: "Course", sortValue: (row) => row.name || "" },
                { key: "description", label: "Description" },
                { key: "price", label: "Price" },
                { key: "teacherId", label: "Teacher", render: (row) => formatPerson(row.teacherId), sortValue: (row) => formatPerson(row.teacherId) },
                {
                  key: "actions",
                  label: "Actions",
                  sortable: false,
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => startCourseEdit(row)}>{tr("Edit")}</button>
                      <button className="button button--ghost" onClick={() => removeItem(row.name || tr("Course"), () => coursesApi.remove(row._id))}>{tr("Delete")}</button>
                    </div>
                  ),
                },
              ]}
            />
          </SectionCard>
        </div>
      ),
    },
    {
      key: "groups",
      label: "Groups",
      note: "Study teams",
      description: "Create, update and remove study groups.",
      render: () => (
        <div className="stack">
          <SectionCard
            title="Group list"
            subtitle="Current study groups"
            action={<button className="button" onClick={() => { setEditingGroupId(""); setGroupDraft(emptyGroupDraft()); setModalState((current) => ({ ...current, groups: true })); }}>{tr("Create group")}</button>}
          >
            <ListToolbar
              value={filters.groups}
              onChange={(value) => setFilters((current) => ({ ...current, groups: value }))}
              placeholder={tr("Search groups by group, course or teacher")}
              summary={`${filteredGroups.length} records`}
            />
            <DataTable
              rows={filteredGroups}
              pageSize={6}
              defaultSortKey="name"
              columns={[
                { key: "name", label: "Group", sortValue: (row) => row.name || "" },
                { key: "course", label: "Course", render: (row) => row.course?.name || EMPTY_VALUE, sortValue: (row) => row.course?.name || "" },
                { key: "teacher", label: "Teacher", render: (row) => formatPerson(row.teacher), sortValue: (row) => formatPerson(row.teacher) },
                { key: "students", label: "Students", render: (row) => Array.isArray(row.students) ? row.students.length : 0 },
                {
                  key: "actions",
                  label: "Actions",
                  sortable: false,
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => startGroupEdit(row)}>{tr("Edit")}</button>
                      <button className="button button--ghost" onClick={() => removeItem(row.name || tr("Group"), () => groupsApi.remove(row._id))}>{tr("Delete")}</button>
                    </div>
                  ),
                },
              ]}
            />
          </SectionCard>
        </div>
      ),
    },
    {
      key: "rooms",
      label: "Rooms",
      note: "Capacity and type",
      description: "Create, update and remove physical rooms.",
      render: () => (
        <div className="stack">
          <SectionCard
            title="Room list"
            subtitle="Available spaces"
            action={<button className="button" onClick={() => { setEditingRoomId(""); setRoomDraft(emptyRoomDraft()); setModalState((current) => ({ ...current, rooms: true })); }}>{tr("Create room")}</button>}
          >
            <ListToolbar
              value={filters.rooms}
              onChange={(value) => setFilters((current) => ({ ...current, rooms: value }))}
              placeholder={tr("Search rooms by name, type or description")}
              summary={`${filteredRooms.length} records`}
            />
            <DataTable
              rows={filteredRooms}
              pageSize={6}
              defaultSortKey="name"
              columns={[
                { key: "name", label: "Room", sortValue: (row) => row.name || "" },
                { key: "capacity", label: "Capacity" },
                { key: "type", label: "Type" },
                { key: "isAvailable", label: "Available", render: (row) => (row.isAvailable ? "Yes" : "No"), sortValue: (row) => (row.isAvailable ? 1 : 0) },
                {
                  key: "actions",
                  label: "Actions",
                  sortable: false,
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => startRoomEdit(row)}>{tr("Edit")}</button>
                      <button className="button button--ghost" onClick={() => removeItem(row.name || tr("Room"), () => roomsApi.remove(row._id))}>{tr("Delete")}</button>
                    </div>
                  ),
                },
              ]}
            />
          </SectionCard>
        </div>
      ),
    },
    {
      key: "schedule",
      label: "Schedule",
      note: "Timing",
      description: "Create, update and remove schedule entries.",
      render: () => (
        <div className="stack">
          <SectionCard
            title="Schedule board"
            subtitle="Current planned classes"
            action={<button className="button" onClick={() => { setEditingScheduleId(""); setScheduleDraft(emptyScheduleDraft()); setModalState((current) => ({ ...current, schedule: true })); }}>{tr("Create schedule")}</button>}
          >
            <ListToolbar
              value={filters.schedule}
              onChange={(value) => setFilters((current) => ({ ...current, schedule: value }))}
              placeholder={tr("Search schedule by course, teacher, group, room or day")}
              summary={`${filteredSchedule.length} records`}
            />
            <DataTable
              rows={filteredSchedule}
              pageSize={6}
              defaultSortKey="weekday"
              columns={[
                { key: "course", label: "Course", render: (row) => row.course?.name || EMPTY_VALUE, sortValue: (row) => row.course?.name || "" },
                { key: "teacher", label: "Teacher", render: (row) => formatPerson(row.teacher), sortValue: (row) => formatPerson(row.teacher) },
                { key: "group", label: "Group", render: (row) => row.group?.name || EMPTY_VALUE, sortValue: (row) => row.group?.name || "" },
                { key: "room", label: "Room", render: (row) => row.room?.name || EMPTY_VALUE, sortValue: (row) => row.room?.name || "" },
                { key: "weekday", label: "Day", render: (row) => formatWeekday(row.weekday || row.date), sortValue: (row) => formatWeekday(row.weekday || row.date) },
                { key: "time", label: "Time", render: (row) => formatScheduleSlot(row), sortValue: (row) => formatScheduleSlot(row) },
                {
                  key: "actions",
                  label: "Actions",
                  sortable: false,
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => startScheduleEdit(row)}>{tr("Edit")}</button>
                      <button className="button button--ghost" onClick={() => removeItem(row.course?.name || tr("Schedule"), () => scheduleApi.remove(row._id))}>{tr("Delete")}</button>
                    </div>
                  ),
                },
              ]}
            />
          </SectionCard>
        </div>
      ),
    },
    {
      key: "payments",
      label: "Payments",
      note: "Cashflow",
      description: "Create, confirm and remove payments.",
      render: () => (
        <div className="stack">
          <SectionCard title="Create payment" subtitle="Student billing">
            <form className="form-grid" onSubmit={(event) => {
              event.preventDefault();
              execute(() => paymentsApi.create(paymentDraft), () => setPaymentDraft(emptyPaymentDraft()));
            }}>
              <div className="form-row">
                <select value={paymentDraft.student} onChange={(e) => setPaymentDraft({ ...paymentDraft, student: e.target.value })}>
                  <option value="">{tr("Select student")}</option>
                  {dataset.students.map((item) => <option key={item._id} value={item._id}>{formatPerson(item)}</option>)}
                </select>
                <select value={paymentDraft.courseId} onChange={(e) => setPaymentDraft({ ...paymentDraft, courseId: e.target.value })}>
                  <option value="">{tr("Select course")}</option>
                  {dataset.courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
                <input type="datetime-local" value={paymentDraft.paidAt} onChange={(e) => setPaymentDraft({ ...paymentDraft, paidAt: e.target.value })} />
              </div>
              <button className="button" type="submit">{tr("Create payment")}</button>
            </form>
          </SectionCard>
          <SectionCard title="Payment ledger" subtitle="Confirm pending items">
            <ListToolbar
              value={filters.payments}
              onChange={(value) => setFilters((current) => ({ ...current, payments: value }))}
              placeholder={tr("Search payments by student, course or amount")}
              summary={`${filteredPayments.length} records`}
            />
            <DataTable
              rows={filteredPayments}
              pageSize={6}
              defaultSortKey="paidAt"
              defaultSortDirection="desc"
              columns={[
                { key: "student", label: "Student", render: (row) => formatPerson(row.student), sortValue: (row) => formatPerson(row.student) },
                { key: "course", label: "Course", render: (row) => row.course?.name || EMPTY_VALUE, sortValue: (row) => row.course?.name || "" },
                { key: "amount", label: "Amount" },
                { key: "paidAt", label: "Paid at", render: (row) => formatDate(row.paidAt), sortValue: (row) => row.paidAt || "" },
                {
                  key: "status",
                  label: "Status",
                  sortable: false,
                  render: (row) => row.isConfirmed ? <span className="pill">{tr("Confirmed")}</span> : <button className="button button--ghost" onClick={() => execute(() => paymentsApi.confirm(row._id))}>{tr("Confirm")}</button>,
                },
                {
                  key: "actions",
                  label: "Actions",
                  sortable: false,
                  render: (row) => <button className="button button--ghost" onClick={() => removeItem(row.course?.name || tr("Payment"), () => paymentsApi.remove(row._id))}>{tr("Delete")}</button>,
                },
              ]}
            />
          </SectionCard>
        </div>
      ),
    },
  ];

  if (features.roles) {
    sections.push({
      key: "roles",
      label: "Roles",
      note: "RBAC records",
      description: "Create, update and remove custom roles.",
      render: () => (
        <div className="stack">
          <SectionCard
            title="Role registry"
            subtitle="Backend role documents"
            action={<button className="button" onClick={() => { setEditingRoleName(""); setRoleDraft(emptyRoleDraft()); setModalState((current) => ({ ...current, roles: true })); }}>{tr("Create role")}</button>}
          >
            <ListToolbar
              value={filters.roles}
              onChange={(value) => setFilters((current) => ({ ...current, roles: value }))}
              placeholder={tr("Search roles by name or permissions")}
              summary={`${filteredRoles.length} records`}
            />
            <DataTable
              rows={filteredRoles}
              pageSize={6}
              defaultSortKey="name"
              columns={[
                { key: "name", label: "Role", sortValue: (row) => row.name || "" },
                { key: "permissions", label: "Permissions", render: (row) => Array.isArray(row.permissions) ? row.permissions.join(", ") : EMPTY_VALUE, sortValue: (row) => Array.isArray(row.permissions) ? row.permissions.join(", ") : "" },
                {
                  key: "actions",
                  label: "Actions",
                  sortable: false,
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => startRoleEdit(row)}>{tr("Edit")}</button>
                      <button className="button button--ghost" onClick={() => removeItem(row.name || tr("Role"), () => rolesApi.remove(row.name))}>{tr("Delete")}</button>
                    </div>
                  ),
                },
              ]}
            />
          </SectionCard>
        </div>
      ),
    });
  }

  if (features.statistics) {
    sections.push({
      key: "statistics",
      label: "Statistics",
      note: "Metrics",
      description: "Create lightweight records and inspect analytics feed.",
      render: () => (
        <div className="stack">
          <SectionCard title="Add statistic" subtitle="Manual metric record">
            <form className="form-grid" onSubmit={(event) => {
              event.preventDefault();
              execute(
                () => statisticsApi.create({
                  type: statDraft.type,
                  value: Number(statDraft.value),
                  date: statDraft.date || new Date().toISOString(),
                }),
                () => setStatDraft(emptyStatDraft()),
              );
            }}>
              <div className="form-row">
                <input value={statDraft.type} onChange={(e) => setStatDraft({ ...statDraft, type: e.target.value })} placeholder="Type" />
                <input type="number" value={statDraft.value} onChange={(e) => setStatDraft({ ...statDraft, value: e.target.value })} placeholder="Value" />
                <input type="datetime-local" value={statDraft.date} onChange={(e) => setStatDraft({ ...statDraft, date: e.target.value })} />
              </div>
              <button className="button" type="submit">{tr("Add statistic")}</button>
            </form>
          </SectionCard>
          <SectionCard title="Statistics feed" subtitle="All metric entries">
            <DataTable
              rows={dataset.statistics}
              columns={[
                { key: "type", label: "Type" },
                { key: "value", label: "Value" },
                { key: "date", label: "Date", render: (row) => formatDate(row.date) },
              ]}
            />
          </SectionCard>
        </div>
      ),
    });
  }

  if (features.phoneRequests) {
    sections.push({
      key: "phone-requests",
      label: "Phone Requests",
      note: "Inbound leads",
      description: "Register leads and manage pending Telegram onboarding requests.",
      render: () => (
        <div className="stack">
          <SectionCard title="Create request" subtitle="Manual phone request">
            <form className="form-grid" onSubmit={(event) => {
              event.preventDefault();
              execute(() => phoneRequestsApi.create(phoneRequestDraft), () => setPhoneRequestDraft(emptyPhoneRequestDraft()));
            }}>
              <div className="form-row">
                <input value={phoneRequestDraft.name} onChange={(e) => setPhoneRequestDraft({ ...phoneRequestDraft, name: e.target.value })} placeholder="Name" />
                <input value={phoneRequestDraft.phone} onChange={(e) => setPhoneRequestDraft({ ...phoneRequestDraft, phone: e.target.value })} placeholder="Phone" />
                <input value={phoneRequestDraft.telegramId} onChange={(e) => setPhoneRequestDraft({ ...phoneRequestDraft, telegramId: e.target.value })} placeholder="Telegram ID" />
              </div>
              <button className="button" type="submit">{tr("Create request")}</button>
            </form>
          </SectionCard>
          <SectionCard title="Pending requests" subtitle="Handle onboarding queue">
            <ListToolbar
              value={filters.phoneRequests}
              onChange={(value) => setFilters((current) => ({ ...current, phoneRequests: value }))}
              placeholder={tr("Search phone requests by name, phone or Telegram ID")}
              summary={`${filteredPhoneRequests.length} records`}
            />
            <DataTable
              rows={filteredPhoneRequests}
              pageSize={6}
              defaultSortKey="name"
              columns={[
                { key: "name", label: "Name", sortValue: (row) => row.name || "" },
                { key: "phone", label: "Phone" },
                { key: "telegramId", label: "Telegram ID" },
                {
                  key: "status",
                  label: "Action",
                  sortable: false,
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => execute(() => phoneRequestsApi.handle({ requestId: row._id, status: "approved" }))}>{tr("Approve")}</button>
                      <button className="button button--ghost" onClick={() => execute(() => phoneRequestsApi.handle({ requestId: row._id, status: "rejected" }))}>{tr("Reject")}</button>
                    </div>
                  ),
                },
              ]}
            />
          </SectionCard>
        </div>
      ),
    });
  }

  const currentSection = sections.find((section) => section.key === activeSection) || sections[0];

  return (
    <AppShell
      title={title || t("management.title", "Management Dashboard")}
      subtitle={subtitle || t("management.subtitle", "Admin, owner and panda workspace")}
      sidebarSections={sections}
      activeSection={currentSection?.key}
      onSectionChange={setActiveSection}
      actions={<button className="button" onClick={refresh}>{t("common.refreshAll", "Refresh all")}</button>}
    >
      {error ? <div className="banner banner--error">{error?.response?.data?.message || error?.message || tr("Failed to load dashboard")}</div> : null}
      {loading ? <div className="empty-state">{t("common.loadingWorkspace", "Loading workspace...")}</div> : null}
      <RoleWorkspace section={currentSection} />
      <FormModal
        open={modalState.users}
        title={editingUserId ? tr("Update user") : tr("Create user")}
        subtitle={editingUserId ? tr("Edit existing account") : tr("Account provisioning")}
        onClose={cancelUserEdit}
      >
        <form className="form-grid" onSubmit={submitUser}>
          <div className="form-row">
            <input value={userDraft.username} onChange={(e) => setUserDraft({ ...userDraft, username: e.target.value })} placeholder={tr("Username")} />
            <input type="password" value={userDraft.password} onChange={(e) => setUserDraft({ ...userDraft, password: e.target.value })} placeholder={editingUserId ? tr("New password (optional)") : tr("Password")} />
            <select value={userDraft.role} onChange={(e) => setUserDraft({ ...userDraft, role: e.target.value })}>
              {roleOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <button className="button" type="submit">{editingUserId ? tr("Save user") : tr("Create user")}</button>
        </form>
      </FormModal>
      <FormModal
        open={modalState.courses}
        title={editingCourseId ? tr("Update course") : tr("Create course")}
        subtitle={editingCourseId ? tr("Edit course card") : tr("One course, one payload")}
        onClose={cancelCourseEdit}
      >
        <form className="form-grid" onSubmit={submitCourse}>
          <div className="form-row">
            <input value={courseDraft.name} onChange={(e) => setCourseDraft({ ...courseDraft, name: e.target.value })} placeholder={tr("Course name")} />
            <input value={courseDraft.description} onChange={(e) => setCourseDraft({ ...courseDraft, description: e.target.value })} placeholder={tr("Description")} />
            <input type="number" min="0" value={courseDraft.price} onChange={(e) => setCourseDraft({ ...courseDraft, price: e.target.value })} placeholder={tr("Price")} />
            <select value={courseDraft.teacherId} onChange={(e) => setCourseDraft({ ...courseDraft, teacherId: e.target.value })}>
              <option value="">{tr("No teacher")}</option>
              {dataset.users.filter((item) => item.role === "teacher").map((item) => <option key={item._id} value={item._id}>{formatPerson(item)}</option>)}
            </select>
          </div>
          <button className="button" type="submit">{editingCourseId ? tr("Save course") : tr("Create course")}</button>
        </form>
      </FormModal>
      <FormModal
        open={modalState.groups}
        title={editingGroupId ? tr("Update group") : tr("Create group")}
        subtitle={editingGroupId ? tr("Edit group structure") : tr("Course cohort")}
        onClose={cancelGroupEdit}
      >
        <form className="form-grid" onSubmit={submitGroup}>
          <div className="form-row">
            <input value={groupDraft.name} onChange={(e) => setGroupDraft({ ...groupDraft, name: e.target.value })} placeholder={tr("Group name")} />
            <select value={groupDraft.course} onChange={(e) => setGroupDraft({ ...groupDraft, course: e.target.value })}>
              <option value="">{tr("Select course")}</option>
              {dataset.courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
            <select value={groupDraft.teacher} onChange={(e) => setGroupDraft({ ...groupDraft, teacher: e.target.value })}>
              <option value="">{tr("Select teacher")}</option>
              {dataset.users.filter((item) => item.role === "teacher").map((item) => <option key={item._id} value={item._id}>{formatPerson(item)}</option>)}
            </select>
            <select multiple value={groupDraft.students} onChange={(e) => setGroupDraft({ ...groupDraft, students: Array.from(e.target.selectedOptions).map((option) => option.value) })}>
              {dataset.students.map((item) => <option key={item._id} value={item._id}>{formatPerson(item)}</option>)}
            </select>
          </div>
          <button className="button" type="submit">{editingGroupId ? tr("Save group") : tr("Create group")}</button>
        </form>
      </FormModal>
      <FormModal
        open={modalState.rooms}
        title={editingRoomId ? tr("Update room") : tr("Create room")}
        subtitle={editingRoomId ? tr("Edit schedule inventory") : tr("Schedule inventory")}
        onClose={cancelRoomEdit}
      >
        <form className="form-grid" onSubmit={submitRoom}>
          <div className="form-row">
            <input value={roomDraft.name} onChange={(e) => setRoomDraft({ ...roomDraft, name: e.target.value })} placeholder={tr("Room name")} />
            <input type="number" min="1" value={roomDraft.capacity} onChange={(e) => setRoomDraft({ ...roomDraft, capacity: e.target.value })} placeholder={tr("Capacity")} />
            <select value={roomDraft.type} onChange={(e) => setRoomDraft({ ...roomDraft, type: e.target.value })}>
              {roomTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input value={roomDraft.description} onChange={(e) => setRoomDraft({ ...roomDraft, description: e.target.value })} placeholder={tr("Description")} />
          </div>
          <button className="button" type="submit">{editingRoomId ? tr("Save room") : tr("Create room")}</button>
        </form>
      </FormModal>
      <FormModal
        open={modalState.schedule}
        title={editingScheduleId ? tr("Update schedule entry") : tr("Create schedule entry")}
        subtitle={editingScheduleId ? tr("Edit planned session") : tr("Plan a session")}
        onClose={cancelScheduleEdit}
      >
        <form className="form-grid" onSubmit={submitSchedule}>
          <div className="form-row">
            <select value={scheduleDraft.course} onChange={(e) => setScheduleDraft({ ...scheduleDraft, course: e.target.value })}>
              <option value="">{tr("Select course")}</option>
              {dataset.courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
            <select value={scheduleDraft.room} onChange={(e) => setScheduleDraft({ ...scheduleDraft, room: e.target.value })}>
              <option value="">{tr("Select room")}</option>
              {dataset.rooms.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
            <select value={scheduleDraft.teacher} onChange={(e) => setScheduleDraft({ ...scheduleDraft, teacher: e.target.value })}>
              <option value="">{tr("Select teacher")}</option>
              {dataset.users.filter((item) => item.role === "teacher").map((item) => <option key={item._id} value={item._id}>{formatPerson(item)}</option>)}
            </select>
            <select value={scheduleDraft.group} onChange={(e) => setScheduleDraft({ ...scheduleDraft, group: e.target.value })}>
              <option value="">{tr("Select group")}</option>
              {dataset.groups.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
            <select value={scheduleDraft.weekday} onChange={(e) => setScheduleDraft({ ...scheduleDraft, weekday: e.target.value })}>
              {WEEKDAY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <input type="time" value={scheduleDraft.timeStart} onChange={(e) => setScheduleDraft({ ...scheduleDraft, timeStart: e.target.value })} />
            <input type="time" value={scheduleDraft.timeEnd} onChange={(e) => setScheduleDraft({ ...scheduleDraft, timeEnd: e.target.value })} />
          </div>
          <button className="button" type="submit">{editingScheduleId ? tr("Save schedule") : tr("Create schedule")}</button>
        </form>
      </FormModal>
      <FormModal
        open={modalState.roles}
        title={editingRoleName ? tr("Update role") : tr("Create role")}
        subtitle={editingRoleName ? tr("Edit permission bundle") : tr("Owner-only backend capability")}
        onClose={cancelRoleEdit}
      >
        <form className="form-grid" onSubmit={submitRole}>
          <div className="form-row">
            <input value={roleDraft.name} onChange={(e) => setRoleDraft({ ...roleDraft, name: e.target.value })} placeholder={tr("Role name")} />
            <input value={roleDraft.permissions} onChange={(e) => setRoleDraft({ ...roleDraft, permissions: e.target.value })} placeholder={tr("permission.read, permission.write")} />
          </div>
          <button className="button" type="submit">{editingRoleName ? tr("Save role") : tr("Create role")}</button>
        </form>
      </FormModal>
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={t("common.delete", "Delete")}
        cancelLabel={t("common.cancel", "Cancel")}
        onCancel={() => setConfirmState({ open: false, title: "", description: "", onConfirm: null })}
        onConfirm={() => confirmState.onConfirm?.()}
      />
      </AppShell>
  );
}
