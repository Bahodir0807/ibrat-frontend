import { useEffect, useState } from "react";
import { AppShell, DataTable, SectionCard, StatStrip } from "../../components/AppShell";
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
  normalizeList,
} from "./helpers";

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
  const features = featurePresets[variant] || featurePresets.admin;
  const [loading, setLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [error, setError] = useState("");
  const [dataset, setDataset] = useState({
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
  });

  const [editingUserId, setEditingUserId] = useState("");
  const [editingCourseId, setEditingCourseId] = useState("");
  const [editingGroupId, setEditingGroupId] = useState("");
  const [editingRoomId, setEditingRoomId] = useState("");
  const [editingScheduleId, setEditingScheduleId] = useState("");
  const [editingRoleName, setEditingRoleName] = useState("");

  const [userDraft, setUserDraft] = useState(emptyUserDraft);
  const [courseDraft, setCourseDraft] = useState(emptyCourseDraft);
  const [groupDraft, setGroupDraft] = useState(emptyGroupDraft);
  const [roomDraft, setRoomDraft] = useState(emptyRoomDraft);
  const [scheduleDraft, setScheduleDraft] = useState(emptyScheduleDraft);
  const [paymentDraft, setPaymentDraft] = useState(emptyPaymentDraft);
  const [roleDraft, setRoleDraft] = useState(emptyRoleDraft);
  const [statDraft, setStatDraft] = useState(emptyStatDraft);
  const [phoneRequestDraft, setPhoneRequestDraft] = useState(emptyPhoneRequestDraft);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
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

        if (cancelled) return;

        setDataset({
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
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.response?.data?.message || loadError?.message || "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshIndex, features.phoneRequests, features.roles, features.statistics]);

  function refresh() {
    setRefreshIndex((value) => value + 1);
  }

  async function execute(action, successReset) {
    try {
      await action();
      successReset?.();
      refresh();
    } catch (submitError) {
      alert(submitError?.response?.data?.message || submitError?.message || "Action failed");
    }
  }

  function removeItem(label, action) {
    if (!window.confirm(`${label}: ${t("common.delete", "Delete")}?`)) return;
    execute(action);
  }

  function startUserEdit(user) {
    setEditingUserId(user._id);
    setUserDraft({ username: user.username || "", password: "", role: user.role || "guest" });
  }

  function cancelUserEdit() {
    setEditingUserId("");
    setUserDraft(emptyUserDraft());
  }

  function submitUser(event) {
    event.preventDefault();
    if (editingUserId) {
      const payload = { username: userDraft.username, role: userDraft.role };
      if (userDraft.password.trim()) payload.password = userDraft.password;
      execute(() => usersApi.update(editingUserId, payload), cancelUserEdit);
      return;
    }
    execute(() => usersApi.create(userDraft), () => setUserDraft(emptyUserDraft()));
  }

  function startCourseEdit(course) {
    setEditingCourseId(course._id);
    setCourseDraft({
      name: course.name || "",
      description: course.description || "",
      price: course.price ?? "",
      teacherId: course.teacherId?._id || "",
    });
  }

  function cancelCourseEdit() {
    setEditingCourseId("");
    setCourseDraft(emptyCourseDraft());
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
    execute(() => coursesApi.create(payload), () => setCourseDraft(emptyCourseDraft()));
  }

  function startGroupEdit(group) {
    setEditingGroupId(group._id);
    setGroupDraft({
      name: group.name || "",
      course: group.course?._id || "",
      teacher: group.teacher?._id || "",
      students: Array.isArray(group.students) ? group.students.map((item) => item._id) : [],
    });
  }

  function cancelGroupEdit() {
    setEditingGroupId("");
    setGroupDraft(emptyGroupDraft());
  }

  function submitGroup(event) {
    event.preventDefault();
    if (editingGroupId) {
      execute(() => groupsApi.update(editingGroupId, groupDraft), cancelGroupEdit);
      return;
    }
    execute(() => groupsApi.create(groupDraft), () => setGroupDraft(emptyGroupDraft()));
  }

  function startRoomEdit(room) {
    setEditingRoomId(room._id);
    setRoomDraft({
      name: room.name || "",
      capacity: room.capacity ?? "",
      type: room.type || "classroom",
      description: room.description || "",
    });
  }

  function cancelRoomEdit() {
    setEditingRoomId("");
    setRoomDraft(emptyRoomDraft());
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
    execute(() => roomsApi.create(payload), () => setRoomDraft(emptyRoomDraft()));
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
  }

  function cancelScheduleEdit() {
    setEditingScheduleId("");
    setScheduleDraft(emptyScheduleDraft());
  }

  function submitSchedule(event) {
    event.preventDefault();
    const payload = buildSchedulePayload(scheduleDraft);
    if (editingScheduleId) {
      execute(() => scheduleApi.update(editingScheduleId, payload), cancelScheduleEdit);
      return;
    }
    execute(() => scheduleApi.create(payload), () => setScheduleDraft(emptyScheduleDraft()));
  }

  function startRoleEdit(role) {
    setEditingRoleName(role.name);
    setRoleDraft({
      name: role.name || "",
      permissions: Array.isArray(role.permissions) ? role.permissions.join(", ") : "",
    });
  }

  function cancelRoleEdit() {
    setEditingRoleName("");
    setRoleDraft(emptyRoleDraft());
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
    execute(() => rolesApi.create(payload), () => setRoleDraft(emptyRoleDraft()));
  }

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
                  { key: "isConfirmed", label: "Status", render: (row) => (row.isConfirmed ? "Confirmed" : "Pending") },
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
            title={editingUserId ? "Update user" : "Create user"}
            subtitle={editingUserId ? "Edit existing account" : "Account provisioning"}
            action={editingUserId ? <button className="button button--ghost" onClick={cancelUserEdit}>{t("common.cancel", "Cancel")}</button> : null}
          >
            <form className="form-grid" onSubmit={submitUser}>
              <div className="form-row">
                <input value={userDraft.username} onChange={(e) => setUserDraft({ ...userDraft, username: e.target.value })} placeholder="Username" />
                <input type="password" value={userDraft.password} onChange={(e) => setUserDraft({ ...userDraft, password: e.target.value })} placeholder={editingUserId ? "New password (optional)" : "Password"} />
                <select value={userDraft.role} onChange={(e) => setUserDraft({ ...userDraft, role: e.target.value })}>
                  {roleOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <button className="button" type="submit">{editingUserId ? "Save user" : "Create user"}</button>
            </form>
          </SectionCard>
          <SectionCard title="Directory" subtitle="Manage existing users">
            <DataTable
              rows={dataset.users}
              columns={[
                { key: "username", label: "Username" },
                { key: "person", label: "Name", render: (row) => formatPerson(row) },
                { key: "role", label: "Role" },
                {
                  key: "changeRole",
                  label: "Access",
                  render: (row) => (
                    <select value={row.role} onChange={(e) => execute(() => usersApi.updateRole(row._id, e.target.value))}>
                      {roleOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => startUserEdit(row)}>Edit</button>
                      <button className="button button--ghost" onClick={() => removeItem(row.username || "User", () => usersApi.remove(row._id))}>Delete</button>
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
            title={editingCourseId ? "Update course" : "Create course"}
            subtitle={editingCourseId ? "Edit course card" : "One course, one payload"}
            action={editingCourseId ? <button className="button button--ghost" onClick={cancelCourseEdit}>{t("common.cancel", "Cancel")}</button> : null}
          >
            <form className="form-grid" onSubmit={submitCourse}>
              <div className="form-row">
                <input value={courseDraft.name} onChange={(e) => setCourseDraft({ ...courseDraft, name: e.target.value })} placeholder="Course name" />
                <input value={courseDraft.description} onChange={(e) => setCourseDraft({ ...courseDraft, description: e.target.value })} placeholder="Description" />
                <input type="number" min="0" value={courseDraft.price} onChange={(e) => setCourseDraft({ ...courseDraft, price: e.target.value })} placeholder="Price" />
                <select value={courseDraft.teacherId} onChange={(e) => setCourseDraft({ ...courseDraft, teacherId: e.target.value })}>
                  <option value="">No teacher</option>
                  {dataset.users.filter((item) => item.role === "teacher").map((item) => <option key={item._id} value={item._id}>{formatPerson(item)}</option>)}
                </select>
              </div>
              <button className="button" type="submit">{editingCourseId ? "Save course" : "Create course"}</button>
            </form>
          </SectionCard>
          <SectionCard title="Course list" subtitle="Current course catalog">
            <DataTable
              rows={dataset.courses}
              columns={[
                { key: "name", label: "Course" },
                { key: "description", label: "Description" },
                { key: "price", label: "Price" },
                { key: "teacherId", label: "Teacher", render: (row) => formatPerson(row.teacherId) },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => startCourseEdit(row)}>Edit</button>
                      <button className="button button--ghost" onClick={() => removeItem(row.name || "Course", () => coursesApi.remove(row._id))}>Delete</button>
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
            title={editingGroupId ? "Update group" : "Create group"}
            subtitle={editingGroupId ? "Edit group structure" : "Course cohort"}
            action={editingGroupId ? <button className="button button--ghost" onClick={cancelGroupEdit}>{t("common.cancel", "Cancel")}</button> : null}
          >
            <form className="form-grid" onSubmit={submitGroup}>
              <div className="form-row">
                <input value={groupDraft.name} onChange={(e) => setGroupDraft({ ...groupDraft, name: e.target.value })} placeholder="Group name" />
                <select value={groupDraft.course} onChange={(e) => setGroupDraft({ ...groupDraft, course: e.target.value })}>
                  <option value="">Select course</option>
                  {dataset.courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
                <select value={groupDraft.teacher} onChange={(e) => setGroupDraft({ ...groupDraft, teacher: e.target.value })}>
                  <option value="">Select teacher</option>
                  {dataset.users.filter((item) => item.role === "teacher").map((item) => <option key={item._id} value={item._id}>{formatPerson(item)}</option>)}
                </select>
                <select multiple value={groupDraft.students} onChange={(e) => setGroupDraft({ ...groupDraft, students: Array.from(e.target.selectedOptions).map((option) => option.value) })}>
                  {dataset.students.map((item) => <option key={item._id} value={item._id}>{formatPerson(item)}</option>)}
                </select>
              </div>
              <button className="button" type="submit">{editingGroupId ? "Save group" : "Create group"}</button>
            </form>
          </SectionCard>
          <SectionCard title="Group list" subtitle="Current study groups">
            <DataTable
              rows={dataset.groups}
              columns={[
                { key: "name", label: "Group" },
                { key: "course", label: "Course", render: (row) => row.course?.name || EMPTY_VALUE },
                { key: "teacher", label: "Teacher", render: (row) => formatPerson(row.teacher) },
                { key: "students", label: "Students", render: (row) => Array.isArray(row.students) ? row.students.length : 0 },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => startGroupEdit(row)}>Edit</button>
                      <button className="button button--ghost" onClick={() => removeItem(row.name || "Group", () => groupsApi.remove(row._id))}>Delete</button>
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
            title={editingRoomId ? "Update room" : "Create room"}
            subtitle={editingRoomId ? "Edit schedule inventory" : "Schedule inventory"}
            action={editingRoomId ? <button className="button button--ghost" onClick={cancelRoomEdit}>{t("common.cancel", "Cancel")}</button> : null}
          >
            <form className="form-grid" onSubmit={submitRoom}>
              <div className="form-row">
                <input value={roomDraft.name} onChange={(e) => setRoomDraft({ ...roomDraft, name: e.target.value })} placeholder="Room name" />
                <input type="number" min="1" value={roomDraft.capacity} onChange={(e) => setRoomDraft({ ...roomDraft, capacity: e.target.value })} placeholder="Capacity" />
                <select value={roomDraft.type} onChange={(e) => setRoomDraft({ ...roomDraft, type: e.target.value })}>
                  {roomTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <input value={roomDraft.description} onChange={(e) => setRoomDraft({ ...roomDraft, description: e.target.value })} placeholder="Description" />
              </div>
              <button className="button" type="submit">{editingRoomId ? "Save room" : "Create room"}</button>
            </form>
          </SectionCard>
          <SectionCard title="Room list" subtitle="Available spaces">
            <DataTable
              rows={dataset.rooms}
              columns={[
                { key: "name", label: "Room" },
                { key: "capacity", label: "Capacity" },
                { key: "type", label: "Type" },
                { key: "isAvailable", label: "Available", render: (row) => (row.isAvailable ? "Yes" : "No") },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => startRoomEdit(row)}>Edit</button>
                      <button className="button button--ghost" onClick={() => removeItem(row.name || "Room", () => roomsApi.remove(row._id))}>Delete</button>
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
            title={editingScheduleId ? "Update schedule entry" : "Create schedule entry"}
            subtitle={editingScheduleId ? "Edit planned session" : "Plan a session"}
            action={editingScheduleId ? <button className="button button--ghost" onClick={cancelScheduleEdit}>{t("common.cancel", "Cancel")}</button> : null}
          >
            <form className="form-grid" onSubmit={submitSchedule}>
              <div className="form-row">
                <select value={scheduleDraft.course} onChange={(e) => setScheduleDraft({ ...scheduleDraft, course: e.target.value })}>
                  <option value="">Select course</option>
                  {dataset.courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
                <select value={scheduleDraft.room} onChange={(e) => setScheduleDraft({ ...scheduleDraft, room: e.target.value })}>
                  <option value="">Select room</option>
                  {dataset.rooms.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
                <select value={scheduleDraft.teacher} onChange={(e) => setScheduleDraft({ ...scheduleDraft, teacher: e.target.value })}>
                  <option value="">Select teacher</option>
                  {dataset.users.filter((item) => item.role === "teacher").map((item) => <option key={item._id} value={item._id}>{formatPerson(item)}</option>)}
                </select>
                <select value={scheduleDraft.group} onChange={(e) => setScheduleDraft({ ...scheduleDraft, group: e.target.value })}>
                  <option value="">Select group</option>
                  {dataset.groups.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
                <select value={scheduleDraft.weekday} onChange={(e) => setScheduleDraft({ ...scheduleDraft, weekday: e.target.value })}>
                  {WEEKDAY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <input type="time" value={scheduleDraft.timeStart} onChange={(e) => setScheduleDraft({ ...scheduleDraft, timeStart: e.target.value })} />
                <input type="time" value={scheduleDraft.timeEnd} onChange={(e) => setScheduleDraft({ ...scheduleDraft, timeEnd: e.target.value })} />
              </div>
              <button className="button" type="submit">{editingScheduleId ? "Save schedule" : "Create schedule"}</button>
            </form>
          </SectionCard>
          <SectionCard title="Schedule board" subtitle="Current planned classes">
            <DataTable
              rows={dataset.schedule}
              columns={[
                { key: "course", label: "Course", render: (row) => row.course?.name || EMPTY_VALUE },
                { key: "teacher", label: "Teacher", render: (row) => formatPerson(row.teacher) },
                { key: "group", label: "Group", render: (row) => row.group?.name || EMPTY_VALUE },
                { key: "room", label: "Room", render: (row) => row.room?.name || EMPTY_VALUE },
                { key: "weekday", label: "Day", render: (row) => formatWeekday(row.weekday || row.date) },
                { key: "time", label: "Time", render: (row) => formatScheduleSlot(row) },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => startScheduleEdit(row)}>Edit</button>
                      <button className="button button--ghost" onClick={() => removeItem(row.course?.name || "Schedule", () => scheduleApi.remove(row._id))}>Delete</button>
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
                  <option value="">Select student</option>
                  {dataset.students.map((item) => <option key={item._id} value={item._id}>{formatPerson(item)}</option>)}
                </select>
                <select value={paymentDraft.courseId} onChange={(e) => setPaymentDraft({ ...paymentDraft, courseId: e.target.value })}>
                  <option value="">Select course</option>
                  {dataset.courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
                <input type="datetime-local" value={paymentDraft.paidAt} onChange={(e) => setPaymentDraft({ ...paymentDraft, paidAt: e.target.value })} />
              </div>
              <button className="button" type="submit">Create payment</button>
            </form>
          </SectionCard>
          <SectionCard title="Payment ledger" subtitle="Confirm pending items">
            <DataTable
              rows={dataset.payments}
              columns={[
                { key: "student", label: "Student", render: (row) => formatPerson(row.student) },
                { key: "course", label: "Course", render: (row) => row.course?.name || EMPTY_VALUE },
                { key: "amount", label: "Amount" },
                { key: "paidAt", label: "Paid at", render: (row) => formatDate(row.paidAt) },
                {
                  key: "status",
                  label: "Status",
                  render: (row) => row.isConfirmed ? <span className="pill">Confirmed</span> : <button className="button button--ghost" onClick={() => execute(() => paymentsApi.confirm(row._id))}>Confirm</button>,
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => <button className="button button--ghost" onClick={() => removeItem(row.course?.name || "Payment", () => paymentsApi.remove(row._id))}>Delete</button>,
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
            title={editingRoleName ? "Update role" : "Create role"}
            subtitle={editingRoleName ? "Edit permission bundle" : "Owner-only backend capability"}
            action={editingRoleName ? <button className="button button--ghost" onClick={cancelRoleEdit}>{t("common.cancel", "Cancel")}</button> : null}
          >
            <form className="form-grid" onSubmit={submitRole}>
              <div className="form-row">
                <input value={roleDraft.name} onChange={(e) => setRoleDraft({ ...roleDraft, name: e.target.value })} placeholder="Role name" />
                <input value={roleDraft.permissions} onChange={(e) => setRoleDraft({ ...roleDraft, permissions: e.target.value })} placeholder="permission.read, permission.write" />
              </div>
              <button className="button" type="submit">{editingRoleName ? "Save role" : "Create role"}</button>
            </form>
          </SectionCard>
          <SectionCard title="Role registry" subtitle="Backend role documents">
            <DataTable
              rows={dataset.roles}
              columns={[
                { key: "name", label: "Role" },
                { key: "permissions", label: "Permissions", render: (row) => Array.isArray(row.permissions) ? row.permissions.join(", ") : EMPTY_VALUE },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => startRoleEdit(row)}>Edit</button>
                      <button className="button button--ghost" onClick={() => removeItem(row.name || "Role", () => rolesApi.remove(row.name))}>Delete</button>
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
              <button className="button" type="submit">Add statistic</button>
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
              <button className="button" type="submit">Create request</button>
            </form>
          </SectionCard>
          <SectionCard title="Pending requests" subtitle="Handle onboarding queue">
            <DataTable
              rows={dataset.phoneRequests}
              columns={[
                { key: "name", label: "Name" },
                { key: "phone", label: "Phone" },
                { key: "telegramId", label: "Telegram ID" },
                {
                  key: "status",
                  label: "Action",
                  render: (row) => (
                    <div className="form-row">
                      <button className="button button--ghost" onClick={() => execute(() => phoneRequestsApi.handle({ requestId: row._id, status: "approved" }))}>Approve</button>
                      <button className="button button--ghost" onClick={() => execute(() => phoneRequestsApi.handle({ requestId: row._id, status: "rejected" }))}>Reject</button>
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

  return (
    <AppShell
      title={title || t("management.title", "Management Dashboard")}
      subtitle={subtitle || t("management.subtitle", "Admin, owner and panda workspace")}
      actions={<button className="button" onClick={refresh}>{t("common.refreshAll", "Refresh all")}</button>}
    >
      {error ? <div className="banner banner--error">{error}</div> : null}
      {loading ? <div className="empty-state">{t("common.loadingWorkspace", "Loading workspace...")}</div> : null}
      <RoleWorkspace sections={sections} initialSection="overview" />
    </AppShell>
  );
}
