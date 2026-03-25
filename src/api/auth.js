import API from "./client";
import { canFallbackToMock, shouldForceMockMode } from "./client";
import {
  mockFetchMe,
  mockLogin,
  mockRegister,
} from "../mock/store";

export async function loginRequest(payload) {
  if (shouldForceMockMode()) {
    return mockLogin(payload);
  }

  try {
    const { data } = await API.post("/auth/login", payload);
    return data;
  } catch (error) {
    if (canFallbackToMock(error)) {
      return mockLogin(payload);
    }
    throw error;
  }
}

export async function registerRequest(payload) {
  if (shouldForceMockMode()) {
    return mockRegister(payload);
  }

  try {
    const { data } = await API.post("/auth/register", payload);
    return data;
  } catch (error) {
    if (canFallbackToMock(error)) {
      return mockRegister(payload);
    }
    throw error;
  }
}

export async function fetchMe() {
  const token = localStorage.getItem("token") || "";

  if (shouldForceMockMode()) {
    return mockFetchMe(token);
  }

  try {
    const { data } = await API.get("/auth/me");
    return data;
  } catch (error) {
    if (canFallbackToMock(error)) {
      return mockFetchMe(token);
    }
    throw error;
  }
}
