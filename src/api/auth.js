import axios from "axios";

const API = axios.create({
  baseURL: "http://ibrat.onrender.com",
  withCredentials: true,
});

export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);
