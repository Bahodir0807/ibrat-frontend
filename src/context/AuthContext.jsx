import { createContext, useContext, useEffect, useState } from "react";
import { fetchMe, loginRequest, registerRequest } from "../api/auth";

const STORAGE_KEYS = {
  token: "token",
  role: "role",
  user: "user",
};

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.token) || "");
  const [role, setRole] = useState(() => localStorage.getItem(STORAGE_KEYS.role) || "");
  const [user, setUser] = useState(() => readStoredUser());

  const persistSession = (nextToken, nextRole, nextUser) => {
    localStorage.setItem(STORAGE_KEYS.token, nextToken);
    localStorage.setItem(STORAGE_KEYS.role, nextRole);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
    setToken(nextToken);
    setRole(nextRole);
    setUser(nextUser);
  };

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.role);
    localStorage.removeItem(STORAGE_KEYS.user);
    setToken("");
    setRole("");
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!localStorage.getItem(STORAGE_KEYS.token)) {
      clearSession();
      setStatus("ready");
      return null;
    }

    try {
      const profile = await fetchMe();
      const nextRole = String(
        profile?.role || localStorage.getItem(STORAGE_KEYS.role) || "",
      ).toLowerCase();
      persistSession(localStorage.getItem(STORAGE_KEYS.token) || "", nextRole, profile);
      setStatus("ready");
      return profile;
    } catch {
      clearSession();
      setStatus("ready");
      return null;
    }
  };

  useEffect(() => {
    if (!token) {
      setStatus("ready");
      return;
    }

    refreshProfile();
  }, []);

  const login = async (credentials) => {
    const response = await loginRequest(credentials);
    const nextToken = response?.token || "";
    const nextRole = String(response?.role || response?.user?.role || "guest").toLowerCase();
    const nextUser = response?.user || null;

    if (!nextToken) {
      throw new Error("Login succeeded but token is missing");
    }

    persistSession(nextToken, nextRole, nextUser);
    setStatus("ready");

    if (!nextUser) {
      await refreshProfile();
    }

    return response;
  };

  const register = async (payload) => registerRequest(payload);

  const logout = () => {
    clearSession();
    setStatus("ready");
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        token,
        role,
        user,
        isAuthenticated: Boolean(token),
        isMockSession: token.startsWith("mock-token:"),
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
