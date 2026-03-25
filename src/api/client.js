import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "https://b.sultonoway.uz";
export const API_MODE = import.meta.env.VITE_API_MODE?.trim() || "auto";

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function shouldForceMockMode() {
  return API_MODE === "mock";
}

export function canFallbackToMock(error) {
  return API_MODE === "auto" && !error?.response;
}

export default API;
