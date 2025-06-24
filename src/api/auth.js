import axios from "axios";

const API = axios.create({
  baseURL: "https://ibrat.onrender.com",
  withCredentials: true,
});

export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);
