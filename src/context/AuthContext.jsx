import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
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

  const meQuery = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: fetchMe,
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!token) {
      setStatus("ready");
      return;
    }

    if (meQuery.isPending) {
      setStatus("loading");
      return;
    }

    if (meQuery.data) {
      const profile = meQuery.data;
      const nextRole = String(profile?.role || role || "").toLowerCase();
      persistSession(token, nextRole, profile);
      setStatus("ready");
      return;
    }

    if (meQuery.isError) {
      clearSession();
      setStatus("ready");
    }
  }, [meQuery.data, meQuery.isError, meQuery.isPending, role, token]);

  const refreshProfile = async () => {
    if (!localStorage.getItem(STORAGE_KEYS.token)) {
      clearSession();
      setStatus("ready");
      return null;
    }

    try {
      const profile = await queryClient.fetchQuery({
        queryKey: ["auth", "me", localStorage.getItem(STORAGE_KEYS.token) || ""],
        queryFn: fetchMe,
        staleTime: 0,
      });
      const nextRole = String(profile?.role || localStorage.getItem(STORAGE_KEYS.role) || "").toLowerCase();
      persistSession(localStorage.getItem(STORAGE_KEYS.token) || "", nextRole, profile);
      setStatus("ready");
      return profile;
    } catch {
      clearSession();
      setStatus("ready");
      return null;
    }
  };

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
    } else {
      queryClient.setQueryData(["auth", "me", nextToken], nextUser);
    }

    return response;
  };

  const register = async (payload) => registerRequest(payload);

  const logout = () => {
    queryClient.removeQueries({ queryKey: ["auth", "me"] });
    clearSession();
    setStatus("ready");
  };

  const value = useMemo(
    () => ({
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
    }),
    [role, status, token, user],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
