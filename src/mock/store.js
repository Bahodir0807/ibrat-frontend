const STORAGE_KEY = "ibrat_mock_db";

const TEMP_OWNER = {
  id: "user_owner_mock",
  username: "temp_owner_test",
  password: "TempOwner123!",
  role: "owner",
  isActive: true,
  firstName: "Temp",
  lastName: "Owner",
  phoneNumber: "+10000000000",
};

const DEFAULT_DB = {
  users: [
    TEMP_OWNER,
    {
      id: "user_teacher_mock",
      username: "teacher_demo",
      password: "Teacher123!",
      role: "teacher",
      isActive: true,
      firstName: "Amina",
      lastName: "Teacher",
      phoneNumber: "+998900000001",
    },
    {
      id: "user_student_mock",
      username: "student_demo",
      password: "Student123!",
      role: "student",
      isActive: true,
      firstName: "Sardor",
      lastName: "Student",
      phoneNumber: "+998900000002",
    },
  ],
  courses: [
    {
      _id: "course_mock_1",
      name: "English Foundations",
      description: "Base English course",
      price: 500000,
      teacherId: {
        _id: "user_teacher_mock",
        username: "teacher_demo",
        firstName: "Amina",
        lastName: "Teacher",
        role: "teacher",
      },
    },
  ],
  rooms: [
    {
      _id: "room_mock_1",
      name: "Room A",
      capacity: 20,
      type: "classroom",
      isAvailable: true,
      description: "Main classroom",
    },
  ],
  groups: [
    {
      _id: "group_mock_1",
      name: "Foundation A",
      course: { _id: "course_mock_1", name: "English Foundations" },
      teacher: {
        _id: "user_teacher_mock",
        username: "teacher_demo",
        firstName: "Amina",
        lastName: "Teacher",
      },
      students: [{ _id: "user_student_mock", username: "student_demo" }],
    },
  ],
  schedule: [
    {
      _id: "schedule_mock_1",
      course: { _id: "course_mock_1", name: "English Foundations" },
      room: { _id: "room_mock_1", name: "Room A" },
      teacher: {
        _id: "user_teacher_mock",
        username: "teacher_demo",
        firstName: "Amina",
        lastName: "Teacher",
      },
      group: { _id: "group_mock_1", name: "Foundation A" },
      students: [{ _id: "user_student_mock", username: "student_demo" }],
      weekday: "monday",
      date: new Date().toISOString(),
      timeStart: new Date().toISOString(),
      timeEnd: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
  ],
  homework: [
    {
      _id: "homework_mock_1",
      userId: "user_student_mock",
      date: new Date().toISOString(),
      tasks: ["Read chapter 1", "Write 5 sentences"],
      completed: false,
    },
  ],
  grades: [
    {
      _id: "grade_mock_1",
      userId: "user_student_mock",
      subject: "English",
      score: 5,
      date: new Date().toISOString(),
    },
  ],
  attendance: [
    {
      _id: "attendance_mock_1",
      userId: "user_student_mock",
      date: new Date().toISOString(),
      status: "present",
    },
  ],
  payments: [
    {
      _id: "payment_mock_1",
      student: { _id: "user_student_mock", username: "student_demo" },
      course: { _id: "course_mock_1", name: "English Foundations" },
      amount: 500000,
      paidAt: new Date().toISOString(),
      isConfirmed: false,
    },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DB));
      return clone(DEFAULT_DB);
    }
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DB));
    return clone(DEFAULT_DB);
  }
}

function writeDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function sanitizeUser(user) {
  const { password, id, ...rest } = user;
  return {
    _id: id,
    ...rest,
  };
}

function findUserByToken(db, token) {
  if (!token?.startsWith("mock-token:")) return null;
  const userId = token.replace("mock-token:", "");
  return db.users.find((user) => user.id === userId) || null;
}

function makeToken(user) {
  return `mock-token:${user.id}`;
}

function delay(result) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(clone(result)), 120);
  });
}

function fail(message, status = 400) {
  const error = new Error(message);
  error.response = { data: { message }, status };
  throw error;
}

function getCurrentUserOrFail(token) {
  const db = readDb();
  const user = findUserByToken(db, token);
  if (!user) {
    fail("Mock session not found", 401);
  }
  return { db, user };
}

export function getMockModeLabel() {
  return "mock";
}

export async function mockLogin(payload) {
  const db = readDb();
  const user = db.users.find(
    (item) =>
      item.username === payload.username && item.password === payload.password,
  );
  if (!user) {
    fail("Invalid credentials", 401);
  }
  return delay({
    token: makeToken(user),
    role: user.role,
    user: sanitizeUser(user),
  });
}

export async function mockRegister(payload) {
  if (!["guest", "student"].includes(payload.role)) {
    fail('Only "guest" and "student" can self-register');
  }

  const db = readDb();
  if (db.users.some((item) => item.username === payload.username)) {
    fail("Username is already taken");
  }

  const user = {
    id: `user_${Date.now()}`,
    username: payload.username,
    password: payload.password,
    role: payload.role,
    isActive: true,
    firstName: payload.username,
  };
  db.users.push(user);
  writeDb(db);
  return delay(sanitizeUser(user));
}

export async function mockFetchMe(token) {
  const { user } = getCurrentUserOrFail(token);
  return delay(sanitizeUser(user));
}

export async function mockUsersList() {
  const db = readDb();
  return delay(db.users.map(sanitizeUser));
}

export async function mockUsersStudents() {
  const db = readDb();
  return delay(db.users.filter((item) => item.role === "student").map(sanitizeUser));
}

export async function mockUsersCreate(payload) {
  const db = readDb();
  const user = {
    id: `user_${Date.now()}`,
    username: payload.username,
    password: payload.password,
    role: payload.role,
    isActive: true,
    firstName: payload.username,
  };
  db.users.push(user);
  writeDb(db);
  return delay(sanitizeUser(user));
}

export async function mockUsersUpdateRole(id, role) {
  const db = readDb();
  const user = db.users.find((item) => item.id === id || item._id === id);
  if (!user) fail("User not found", 404);
  user.role = role;
  writeDb(db);
  return delay(sanitizeUser(user));
}

export async function mockUsersUpdate(id, payload) {
  const db = readDb();
  const user = db.users.find((item) => item.id === id || item._id === id);
  if (!user) fail("User not found", 404);
  Object.assign(user, payload);
  if (payload.password === "") {
    delete user.password;
  }
  writeDb(db);
  return delay(sanitizeUser(user));
}

export async function mockUsersRemove(id) {
  const db = readDb();
  db.users = db.users.filter((item) => item.id !== id && item._id !== id);
  writeDb(db);
  return delay({ message: "User deleted successfully" });
}

export async function mockCoursesList() {
  const db = readDb();
  return delay(db.courses);
}

export async function mockCoursesCreate(payload) {
  const db = readDb();
  const teacher = db.users.find((item) => item.id === payload.teacherId);
  const course = {
    _id: `course_${Date.now()}`,
    name: payload.name,
    description: payload.description,
    price: payload.price,
    teacherId: teacher ? sanitizeUser(teacher) : null,
  };
  db.courses.push(course);
  writeDb(db);
  return delay(course);
}

export async function mockCoursesUpdate(id, payload) {
  const db = readDb();
  const course = db.courses.find((item) => item._id === id);
  if (!course) fail("Course not found", 404);
  const teacher = payload.teacherId ? db.users.find((item) => item.id === payload.teacherId || item._id === payload.teacherId) : null;
  Object.assign(course, payload);
  if ("teacherId" in payload) {
    course.teacherId = teacher ? sanitizeUser(teacher) : null;
  }
  writeDb(db);
  return delay(course);
}

export async function mockCoursesRemove(id) {
  const db = readDb();
  db.courses = db.courses.filter((item) => item._id !== id);
  writeDb(db);
  return delay({ deleted: true });
}

export async function mockRoomsList() {
  return delay(readDb().rooms);
}

export async function mockRoomsCreate(payload) {
  const db = readDb();
  const room = {
    _id: `room_${Date.now()}`,
    ...payload,
  };
  db.rooms.push(room);
  writeDb(db);
  return delay(room);
}

export async function mockRoomsUpdate(id, payload) {
  const db = readDb();
  const room = db.rooms.find((item) => item._id === id);
  if (!room) fail("Room not found", 404);
  Object.assign(room, payload);
  writeDb(db);
  return delay(room);
}

export async function mockRoomsRemove(id) {
  const db = readDb();
  db.rooms = db.rooms.filter((item) => item._id !== id);
  writeDb(db);
  return delay({ deleted: true });
}

export async function mockGroupsList() {
  return delay(readDb().groups || []);
}

export async function mockGroupsCreate(payload) {
  const db = readDb();
  const course = db.courses.find((item) => item._id === payload.course);
  const teacher = db.users.find((item) => item.id === payload.teacher);
  const students = db.users
    .filter((item) => (payload.students || []).includes(item.id))
    .map(sanitizeUser);

  const group = {
    _id: `group_${Date.now()}`,
    name: payload.name,
    course: course || { _id: payload.course, name: "Unknown course" },
    teacher: teacher ? sanitizeUser(teacher) : { _id: payload.teacher, username: "teacher" },
    students,
  };

  db.groups ??= [];
  db.groups.push(group);
  writeDb(db);
  return delay(group);
}

export async function mockGroupsUpdate(id, payload) {
  const db = readDb();
  const group = (db.groups || []).find((item) => item._id === id);
  if (!group) fail("Group not found", 404);
  const course = payload.course ? db.courses.find((item) => item._id === payload.course) : null;
  const teacher = payload.teacher ? db.users.find((item) => item.id === payload.teacher || item._id === payload.teacher) : null;
  const students = Array.isArray(payload.students)
    ? db.users.filter((item) => payload.students.includes(item.id) || payload.students.includes(item._id)).map(sanitizeUser)
    : null;

  if ("name" in payload) group.name = payload.name;
  if ("course" in payload) group.course = course || null;
  if ("teacher" in payload) group.teacher = teacher ? sanitizeUser(teacher) : null;
  if (students) group.students = students;
  writeDb(db);
  return delay(group);
}

export async function mockGroupsRemove(id) {
  const db = readDb();
  db.groups = (db.groups || []).filter((item) => item._id !== id);
  writeDb(db);
  return delay({ deleted: true });
}

export async function mockScheduleList() {
  return delay(readDb().schedule);
}

export async function mockScheduleMine(token) {
  const { db, user } = getCurrentUserOrFail(token);
  if (["admin", "owner", "panda"].includes(user.role)) {
    return delay(db.schedule);
  }
  if (user.role === "teacher") {
    return delay(db.schedule.filter((item) => item.teacher?._id === user.id));
  }
  return delay(
    db.schedule.filter((item) =>
      (item.students || []).some((student) => student._id === user.id),
    ),
  );
}

export async function mockScheduleCreate(payload) {
  const db = readDb();
  const course = db.courses.find((item) => item._id === payload.course);
  const room = db.rooms.find((item) => item._id === payload.room);
  const teacher = db.users.find((item) => item.id === payload.teacher);
  const item = {
    _id: `schedule_${Date.now()}`,
    course: course || { _id: payload.course, name: "Unknown course" },
    room: room || { _id: payload.room, name: "Unknown room" },
    teacher: teacher ? sanitizeUser(teacher) : { _id: payload.teacher, username: "teacher" },
    group: payload.group
      ? db.groups?.find((entry) => entry._id === payload.group) || { _id: payload.group, name: "Unknown group" }
      : null,
    students: [],
    weekday: payload.weekday,
    date: payload.date,
    timeStart: payload.timeStart,
    timeEnd: payload.timeEnd,
  };
  db.schedule.push(item);
  writeDb(db);
  return delay(item);
}

export async function mockScheduleUpdate(id, payload) {
  const db = readDb();
  const item = db.schedule.find((entry) => entry._id === id);
  if (!item) fail("Schedule item not found", 404);
  const course = payload.course ? db.courses.find((entry) => entry._id === payload.course) : null;
  const room = payload.room ? db.rooms.find((entry) => entry._id === payload.room) : null;
  const teacher = payload.teacher ? db.users.find((entry) => entry.id === payload.teacher || entry._id === payload.teacher) : null;
  const group = payload.group ? (db.groups || []).find((entry) => entry._id === payload.group) : null;

  if ("course" in payload) item.course = course || null;
  if ("room" in payload) item.room = room || null;
  if ("teacher" in payload) item.teacher = teacher ? sanitizeUser(teacher) : null;
  if ("group" in payload) item.group = group || null;
  if ("date" in payload) item.date = payload.date;
  if ("timeStart" in payload) item.timeStart = payload.timeStart;
  if ("timeEnd" in payload) item.timeEnd = payload.timeEnd;
  writeDb(db);
  return delay(item);
}

export async function mockScheduleRemove(id) {
  const db = readDb();
  db.schedule = db.schedule.filter((item) => item._id !== id);
  writeDb(db);
  return delay({ deleted: true });
}

export async function mockHomeworkMine(token) {
  const { db, user } = getCurrentUserOrFail(token);
  return delay(db.homework.filter((item) => item.userId === user.id));
}

export async function mockHomeworkCreate(payload) {
  const db = readDb();
  const item = {
    _id: `homework_${Date.now()}`,
    ...payload,
    completed: false,
  };
  db.homework.push(item);
  writeDb(db);
  return delay(item);
}

export async function mockHomeworkComplete(id) {
  const db = readDb();
  const item = db.homework.find((entry) => entry._id === id);
  if (!item) fail("Homework not found", 404);
  item.completed = true;
  writeDb(db);
  return delay(item);
}

export async function mockGradesMine(token) {
  const { db, user } = getCurrentUserOrFail(token);
  return delay(db.grades.filter((item) => item.userId === user.id));
}

export async function mockGradesCreate(payload) {
  const db = readDb();
  const item = {
    _id: `grade_${Date.now()}`,
    ...payload,
    date: new Date().toISOString(),
  };
  db.grades.push(item);
  writeDb(db);
  return delay(item);
}

export async function mockGradesUpdate(id, payload) {
  const db = readDb();
  const item = db.grades.find((entry) => entry._id === id);
  if (!item) fail("Grade not found", 404);
  if ("score" in payload) item.score = payload.score;
  writeDb(db);
  return delay(item);
}

export async function mockAttendanceMine(token) {
  const { db, user } = getCurrentUserOrFail(token);
  return delay(db.attendance.filter((item) => item.userId === user.id));
}

export async function mockAttendanceCreate(payload) {
  const db = readDb();
  const existing = db.attendance.find(
    (item) => item.userId === payload.userId && item.date === payload.date,
  );
  if (existing) {
    existing.status = payload.status;
    writeDb(db);
    return delay(existing);
  }
  const item = {
    _id: `attendance_${Date.now()}`,
    ...payload,
  };
  db.attendance.push(item);
  writeDb(db);
  return delay(item);
}

export async function mockPaymentsMine(token) {
  const { db, user } = getCurrentUserOrFail(token);
  return delay(
    db.payments.filter((item) => item.student?._id === user.id),
  );
}

export async function mockPaymentsList() {
  return delay(readDb().payments);
}

export async function mockPaymentsCreate(payload) {
  const db = readDb();
  const student = db.users.find((item) => item.id === payload.student);
  const course = db.courses.find((item) => item._id === payload.courseId);
  const item = {
    _id: `payment_${Date.now()}`,
    student: student ? sanitizeUser(student) : { _id: payload.student, username: "student" },
    course: course || { _id: payload.courseId, name: "Unknown course" },
    amount: course?.price || 0,
    paidAt: payload.paidAt || new Date().toISOString(),
    isConfirmed: false,
  };
  db.payments.push(item);
  writeDb(db);
  return delay(item);
}

export async function mockPaymentsConfirm(id) {
  const db = readDb();
  const item = db.payments.find((entry) => entry._id === id);
  if (!item) fail("Payment not found", 404);
  item.isConfirmed = true;
  writeDb(db);
  return delay(item);
}

export async function mockPaymentsRemove(id) {
  const db = readDb();
  db.payments = db.payments.filter((item) => item._id !== id);
  writeDb(db);
  return delay({ deleted: true });
}
