import API from "./client";
import { canFallbackToMock, shouldForceMockMode } from "./client";
import {
  mockAttendanceCreate,
  mockAttendanceMine,
  mockCoursesCreate,
  mockCoursesList,
  mockCoursesRemove,
  mockCoursesUpdate,
  mockGradesCreate,
  mockGradesMine,
  mockGradesUpdate,
  mockGroupsCreate,
  mockGroupsList,
  mockGroupsRemove,
  mockGroupsUpdate,
  mockHomeworkComplete,
  mockHomeworkCreate,
  mockHomeworkMine,
  mockPaymentsConfirm,
  mockPaymentsCreate,
  mockPaymentsList,
  mockPaymentsMine,
  mockPaymentsRemove,
  mockRoomsCreate,
  mockRoomsList,
  mockRoomsRemove,
  mockRoomsUpdate,
  mockScheduleCreate,
  mockScheduleList,
  mockScheduleMine,
  mockScheduleRemove,
  mockScheduleUpdate,
  mockUsersCreate,
  mockUsersList,
  mockUsersRemove,
  mockUsersStudents,
  mockUsersUpdate,
  mockUsersUpdateRole,
} from "../mock/store";

async function withFallback(apiCall, mockCall) {
  if (shouldForceMockMode()) {
    return mockCall();
  }

  try {
    return await apiCall();
  } catch (error) {
    if (canFallbackToMock(error)) {
      return mockCall();
    }
    throw error;
  }
}

export const usersApi = {
  me: async () => withFallback(async () => (await API.get("/users/me")).data, async () => {
    const list = await mockUsersList();
    const token = localStorage.getItem("token") || "";
    return list.find((item) => token.endsWith(item._id)) || list[0];
  }),
  list: async () => withFallback(async () => (await API.get("/users")).data, mockUsersList),
  students: async () => withFallback(async () => (await API.get("/users/students")).data, mockUsersStudents),
  create: async (payload) => withFallback(async () => (await API.post("/users", payload)).data, () => mockUsersCreate(payload)),
  update: async (id, payload) => withFallback(async () => (await API.put(`/users/${id}`, payload)).data, () => mockUsersUpdate(id, payload)),
  updateRole: async (id, role) =>
    withFallback(async () => (await API.patch(`/users/${id}/role`, { role })).data, () => mockUsersUpdateRole(id, role)),
  remove: async (id) => withFallback(async () => (await API.delete(`/users/${id}`)).data, () => mockUsersRemove(id)),
};

export const coursesApi = {
  list: async () => withFallback(async () => (await API.get("/courses")).data, mockCoursesList),
  create: async (payload) => withFallback(async () => (await API.post("/courses", payload)).data, () => mockCoursesCreate(payload)),
  update: async (id, payload) => withFallback(async () => (await API.patch(`/courses/${id}`, payload)).data, () => mockCoursesUpdate(id, payload)),
  remove: async (id) => withFallback(async () => (await API.delete(`/courses/${id}`)).data, () => mockCoursesRemove(id)),
};

export const roomsApi = {
  list: async () => withFallback(async () => (await API.get("/rooms")).data, mockRoomsList),
  create: async (payload) => withFallback(async () => (await API.post("/rooms", payload)).data, () => mockRoomsCreate(payload)),
  update: async (id, payload) => withFallback(async () => (await API.patch(`/rooms/${id}`, payload)).data, () => mockRoomsUpdate(id, payload)),
  remove: async (id) => withFallback(async () => (await API.delete(`/rooms/${id}`)).data, () => mockRoomsRemove(id)),
};

export const groupsApi = {
  list: async () => withFallback(async () => (await API.get("/groups")).data, mockGroupsList),
  create: async (payload) => withFallback(async () => (await API.post("/groups", payload)).data, () => mockGroupsCreate(payload)),
  update: async (id, payload) => withFallback(async () => (await API.patch(`/groups/${id}`, payload)).data, () => mockGroupsUpdate(id, payload)),
  remove: async (id) => withFallback(async () => (await API.delete(`/groups/${id}`)).data, () => mockGroupsRemove(id)),
};

export const scheduleApi = {
  mine: async () =>
    withFallback(
      async () => (await API.get("/schedule/me")).data,
      () => mockScheduleMine(localStorage.getItem("token") || ""),
    ),
  list: async () => withFallback(async () => (await API.get("/schedule")).data, mockScheduleList),
  create: async (payload) => withFallback(async () => (await API.post("/schedule", payload)).data, () => mockScheduleCreate(payload)),
  update: async (id, payload) => withFallback(async () => (await API.put(`/schedule/${id}`, payload)).data, () => mockScheduleUpdate(id, payload)),
  remove: async (id) => withFallback(async () => (await API.delete(`/schedule/${id}`)).data, () => mockScheduleRemove(id)),
};

export const homeworkApi = {
  mine: async () =>
    withFallback(
      async () => (await API.get("/homework/me")).data,
      () => mockHomeworkMine(localStorage.getItem("token") || ""),
    ),
  create: async (payload) => withFallback(async () => (await API.post("/homework", payload)).data, () => mockHomeworkCreate(payload)),
  complete: async (id) => withFallback(async () => (await API.patch(`/homework/${id}/complete`)).data, () => mockHomeworkComplete(id)),
};

export const gradesApi = {
  mine: async () =>
    withFallback(
      async () => (await API.get("/grades/me")).data,
      () => mockGradesMine(localStorage.getItem("token") || ""),
    ),
  byUser: async (userId) => withFallback(async () => (await API.get(`/grades/user/${userId}`)).data, () => mockGradesMine(`mock-token:${userId}`)),
  create: async (payload) => withFallback(async () => (await API.post("/grades", payload)).data, () => mockGradesCreate(payload)),
  update: async (id, payload) => withFallback(async () => (await API.patch(`/grades/${id}`, payload)).data, () => mockGradesUpdate(id, payload)),
};

export const attendanceApi = {
  mine: async () =>
    withFallback(
      async () => (await API.get("/attendance/me")).data,
      () => mockAttendanceMine(localStorage.getItem("token") || ""),
    ),
  create: async (payload) => withFallback(async () => (await API.post("/attendance", payload)).data, () => mockAttendanceCreate(payload)),
};

export const paymentsApi = {
  mine: async () =>
    withFallback(
      async () => (await API.get("/payments/me")).data,
      () => mockPaymentsMine(localStorage.getItem("token") || ""),
    ),
  list: async () => withFallback(async () => (await API.get("/payments")).data, mockPaymentsList),
  create: async (payload) => withFallback(async () => (await API.post("/payments", payload)).data, () => mockPaymentsCreate(payload)),
  confirm: async (id) => withFallback(async () => (await API.patch(`/payments/${id}/confirm`)).data, () => mockPaymentsConfirm(id)),
  remove: async (id) => withFallback(async () => (await API.delete(`/payments/${id}`)).data, () => mockPaymentsRemove(id)),
};

export const notificationsApi = {
  create: async (payload) => (await API.post("/notifications", payload)).data,
};

export const statisticsApi = {
  list: async () => (await API.get("/statistics")).data,
  create: async (payload) => (await API.post("/statistics", payload)).data,
  byType: async (type) => (await API.get(`/statistics/${type}`)).data,
};

export const rolesApi = {
  list: async () => (await API.get("/roles")).data,
  create: async (payload) => (await API.post("/roles", payload)).data,
  update: async (name, payload) => (await API.patch(`/roles/${name}`, payload)).data,
  remove: async (name) => (await API.delete(`/roles/${name}`)).data,
};

export const phoneRequestsApi = {
  listPending: async () => (await API.get("/phone-request/pending")).data,
  create: async (payload) => (await API.post("/phone-request", payload)).data,
  handle: async (payload) => (await API.patch("/phone-request", payload)).data,
};
