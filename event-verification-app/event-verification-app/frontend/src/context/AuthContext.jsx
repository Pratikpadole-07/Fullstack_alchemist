import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import client, { setAuthToken } from "../api/client.js";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      setAuthToken(token);
      const raw = localStorage.getItem("user");
      if (raw) {
        try {
          setUser(JSON.parse(raw));
        } catch {
          setUser(null);
        }
      }
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setAuthToken(null);
      setUser(null);
    }
  }, [token]);

  const login = async (email, password) => {
    const { data } = await client.post("/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  };

  const signup = async (payload) => {
    const { data } = await client.post("/auth/signup", payload);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      signup,
      logout,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
