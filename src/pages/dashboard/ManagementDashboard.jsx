import { useEffect, useMemo, useState } from "react";
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

const featurePresets = {
  owner: {
    roles: true,
    statistics: true,
    phoneRequests: true,
  },
  admin: {
    roles: false,
    statistics: true,
    phoneRequests: false,
  },
  panda: {
    roles: false,
    statistics: false,
    phoneRequests: true,
  },
};

export default function ManagementDashboard({
  title,
  subtitle,
  variant = "admin",
}) {
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

  const [userDraft, setUserDraft] = useState({ username: "", password: "", role: "guest" });
  const [courseDraft, setCourseDraft] = useState({ name: "", description: "", price: "", teacherId: "" });
  const [groupDraft, setGroupDraft] = useState({ name: "", course: "", teacher: "", students: [] });
  const [roomDraft, setRoomDraft] = useState({ name: "", capacity: "", type: "classroom", description: "" });
  const [scheduleDraft, setScheduleDraft] = useState({ course: "", room: "", group: "", weekday: "monday", timeStart: "", timeEnd: "", teacher: "" });
  const [paymentDraft, setPaymentDraft] = useState({ student: "", courseId: "", paidAt: "" });
  const [roleDraft, setRoleDraft] = useState({ name: "", permissions: "" });
  const [statDraft, setStatDraft] = useState({ type: "", value: "", date: "" });
  const [phoneRequestDraft, setPhoneRequestDraft] = useState({ phone: "", name: "", telegramId: "" });

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
        ];

        if (features.roles) {
          requests.push(rolesApi.list());
        } else {
          requests.push(Promise.resolve([]));
        }

        if (features.statistics) {
          requests.push(statisticsApi.list());
        } else {
          requests.push(Promise.resolve([]));
        }

        if (features.phoneRequests) {
          requests.push(phoneRequestsApi.listPending());
        } else {
          requests.push(Promise.resolve([]));
        }

        const [
          users,
          students,
          courses,
          groups,
          rooms,
          schedule,
          payments,
          roles,
          statistics,
          phoneRequests,
        ] = await Promise.all(requests);

        if (!cancelled) {
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
        }
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
  }, [refreshIndex, features.roles, features.statistics, features.phoneRequests]);

  const refresh = () => setRefreshIndex((value) => value + 1);

  async function handleSubmit(action, payload, reset) {
    try {
      await action(payload);
      reset?.();
      refresh();
    } catch (submitError) {
      alert(submitError?.response?.data?.message || submitError?.message || "Action failed");
    }
  }

  const sections = useMemo(() => {
    const baseSections = [
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
                    { key: "course", label: "Course", render: (row) => row.course?.name || "—" },
                    { key: "teacher", label: "Teacher", render: (row) => formatPerson(row.teacher) },
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
        description: "Create users and change access role assignments.",
        render: () => (
          <div className="stack">
            <SectionCard title="Create user" subtitle="Account provisioning">
              <form className="form-grid" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(usersApi.create, userDraft, () => setUserDraft({ username: "", password: "", role: "guest" }));
              }}>
                <div className="form-row">
                  <input value={userDraft.username} onChange={(e) => setUserDraft({ ...userDraft, username: e.target.value })} placeholder="Username" />
                  <input type="password" value={userDraft.password} onChange={(e) => setUserDraft({ ...userDraft, password: e.target.value })} placeholder="Password" />
                  <select value={userDraft.role} onChange={(e) => setUserDraft({ ...userDraft, role: e.target.value })}>
                    {roleOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <button className="button" type="submit">Create user</button>
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
                      <select
                        defaultValue={row.role}
                        onChange={(e) =>
                          handleSubmit(
                            () => usersApi.updateRole(row._id, e.target.value),
                            null,
                            null,
                          )
                        }
                      >
                        {roleOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
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
        description: "Create and review courses with teacher assignments.",
        render: () => (
          <div className="stack">
            <SectionCard title="Create course" subtitle="One course, one payload">
              <form className="form-grid" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(
                  coursesApi.create,
                  { ...courseDraft, price: Number(courseDraft.price), teacherId: courseDraft.teacherId || undefined },
                  () => setCourseDraft({ name: "", description: "", price: "", teacherId: "" }),
                );
              }}>
                <div className="form-row">
                  <input value={courseDraft.name} onChange={(e) => setCourseDraft({ ...courseDraft, name: e.target.value })} placeholder="Course name" />
                  <input value={courseDraft.description} onChange={(e) => setCourseDraft({ ...courseDraft, description: e.target.value })} placeholder="Description" />
                  <input type="number" min="0" value={courseDraft.price} onChange={(e) => setCourseDraft({ ...courseDraft, price: e.target.value })} placeholder="Price" />
                  <select value={courseDraft.teacherId} onChange={(e) => setCourseDraft({ ...courseDraft, teacherId: e.target.value })}>
                    <option value="">No teacher</option>
                    {dataset.users.filter((item) => item.role === "teacher").map((item) => <option key={item._id} value={item._id}>{formatPerson(item)}</option>)}
                  </select>
                </div>
                <button className="button" type="submit">Create course</button>
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
        description: "Create study groups and bind course, teacher and students.",
        render: () => (
          <div className="stack">
            <SectionCard title="Create group" subtitle="Course cohort">
              <form className="form-grid" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(
                  groupsApi.create,
                  groupDraft,
                  () => setGroupDraft({ name: "", course: "", teacher: "", students: [] }),
                );
              }}>
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
                  <select
                    multiple
                    value={groupDraft.students}
                    onChange={(e) => setGroupDraft({ ...groupDraft, students: Array.from(e.target.selectedOptions).map((option) => option.value) })}
                  >
                    {dataset.students.map((item) => <option key={item._id} value={item._id}>{formatPerson(item)}</option>)}
                  </select>
                </div>
                <button className="button" type="submit">Create group</button>
              </form>
            </SectionCard>
            <SectionCard title="Group list" subtitle="Current study groups">
              <DataTable
                rows={dataset.groups}
                columns={[
                  { key: "name", label: "Group" },
                  { key: "course", label: "Course", render: (row) => row.course?.name || "—" },
                  { key: "teacher", label: "Teacher", render: (row) => formatPerson(row.teacher) },
                  { key: "students", label: "Students", render: (row) => Array.isArray(row.students) ? row.students.length : 0 },
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
        description: "Create physical rooms used by schedule entries.",
        render: () => (
          <div className="stack">
            <SectionCard title="Create room" subtitle="Schedule inventory">
              <form className="form-grid" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(
                  roomsApi.create,
                  { ...roomDraft, capacity: Number(roomDraft.capacity) },
                  () => setRoomDraft({ name: "", capacity: "", type: "classroom", description: "" }),
                );
              }}>
                <div className="form-row">
                  <input value={roomDraft.name} onChange={(e) => setRoomDraft({ ...roomDraft, name: e.target.value })} placeholder="Room name" />
                  <input type="number" min="1" value={roomDraft.capacity} onChange={(e) => setRoomDraft({ ...roomDraft, capacity: e.target.value })} placeholder="Capacity" />
                  <select value={roomDraft.type} onChange={(e) => setRoomDraft({ ...roomDraft, type: e.target.value })}>
                    {roomTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <input value={roomDraft.description} onChange={(e) => setRoomDraft({ ...roomDraft, description: e.target.value })} placeholder="Description" />
                </div>
                <button className="button" type="submit">Create room</button>
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
        description: "Create schedule items and review planned sessions.",
        render: () => (
          <div className="stack">
            <SectionCard title="Create schedule entry" subtitle="Plan a session">
              <form className="form-grid" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(
                  scheduleApi.create,
                  buildSchedulePayload(scheduleDraft),
                  () => setScheduleDraft({ course: "", room: "", group: "", weekday: "monday", timeStart: "", timeEnd: "", teacher: "" }),
                );
              }}>
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
                <button className="button" type="submit">Create schedule</button>
              </form>
            </SectionCard>
            <SectionCard title="Schedule board" subtitle="Current planned classes">
              <DataTable
                rows={dataset.schedule}
                columns={[
                  { key: "course", label: "Course", render: (row) => row.course?.name || "—" },
                  { key: "teacher", label: "Teacher", render: (row) => formatPerson(row.teacher) },
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
        key: "payments",
        label: "Payments",
        note: "Cashflow",
        description: "Create student payments and confirm pending entries.",
        render: () => (
          <div className="stack">
            <SectionCard title="Create payment" subtitle="Student billing">
              <form className="form-grid" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(
                  paymentsApi.create,
                  paymentDraft,
                  () => setPaymentDraft({ student: "", courseId: "", paidAt: "" }),
                );
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
                  { key: "course", label: "Course", render: (row) => row.course?.name || "—" },
                  { key: "amount", label: "Amount" },
                  { key: "paidAt", label: "Paid at", render: (row) => formatDate(row.paidAt) },
                  {
                    key: "status",
                    label: "Status",
                    render: (row) =>
                      row.isConfirmed ? (
                        <span className="pill">Confirmed</span>
                      ) : (
                        <button className="button button--ghost" onClick={() => handleSubmit(() => paymentsApi.confirm(row._id), null, null)}>
                          Confirm
                        </button>
                      ),
                  },
                ]}
              />
            </SectionCard>
          </div>
        ),
      },
    ];

    if (features.roles) {
      baseSections.push({
        key: "roles",
        label: "Roles",
        note: "RBAC records",
        description: "Create custom roles and permission bundles.",
        render: () => (
          <div className="stack">
            <SectionCard title="Create role" subtitle="Owner-only backend capability">
              <form className="form-grid" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(
                  rolesApi.create,
                  {
                    name: roleDraft.name,
                    permissions: roleDraft.permissions.split(",").map((item) => item.trim()).filter(Boolean),
                  },
                  () => setRoleDraft({ name: "", permissions: "" }),
                );
              }}>
                <div className="form-row">
                  <input value={roleDraft.name} onChange={(e) => setRoleDraft({ ...roleDraft, name: e.target.value })} placeholder="Role name" />
                  <input value={roleDraft.permissions} onChange={(e) => setRoleDraft({ ...roleDraft, permissions: e.target.value })} placeholder="permission.read, permission.write" />
                </div>
                <button className="button" type="submit">Create role</button>
              </form>
            </SectionCard>
            <SectionCard title="Role registry" subtitle="Backend role documents">
              <DataTable
                rows={dataset.roles}
                columns={[
                  { key: "name", label: "Role" },
                  { key: "permissions", label: "Permissions", render: (row) => Array.isArray(row.permissions) ? row.permissions.join(", ") : "—" },
                ]}
              />
            </SectionCard>
          </div>
        ),
      });
    }

    if (features.statistics) {
      baseSections.push({
        key: "statistics",
        label: "Statistics",
        note: "Metrics",
        description: "Create lightweight records and inspect analytics feed.",
        render: () => (
          <div className="stack">
            <SectionCard title="Add statistic" subtitle="Manual metric record">
              <form className="form-grid" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(
                  statisticsApi.create,
                  {
                    type: statDraft.type,
                    value: Number(statDraft.value),
                    date: statDraft.date || new Date().toISOString(),
                  },
                  () => setStatDraft({ type: "", value: "", date: "" }),
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
      baseSections.push({
        key: "phone-requests",
        label: "Phone Requests",
        note: "Inbound leads",
        description: "Register leads and manage pending Telegram onboarding requests.",
        render: () => (
          <div className="stack">
            <SectionCard title="Create request" subtitle="Manual phone request">
              <form className="form-grid" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(
                  phoneRequestsApi.create,
                  phoneRequestDraft,
                  () => setPhoneRequestDraft({ phone: "", name: "", telegramId: "" }),
                );
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
                        <button className="button button--ghost" onClick={() => handleSubmit(() => phoneRequestsApi.handle({ requestId: row._id, status: "approved" }), null, null)}>Approve</button>
                        <button className="button button--ghost" onClick={() => handleSubmit(() => phoneRequestsApi.handle({ requestId: row._id, status: "rejected" }), null, null)}>Reject</button>
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

    return baseSections;
  }, [
    dataset,
    features.roles,
    features.statistics,
    features.phoneRequests,
    userDraft,
    courseDraft,
    roomDraft,
    scheduleDraft,
    paymentDraft,
    roleDraft,
    statDraft,
    phoneRequestDraft,
  ]);

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
