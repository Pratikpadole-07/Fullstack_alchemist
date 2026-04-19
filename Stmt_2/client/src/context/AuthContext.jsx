import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { setAuthToken } from "../api/axios.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "cov_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          localStorage.removeItem(TOKEN_KEY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback((newToken, u) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
