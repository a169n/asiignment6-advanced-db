"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api } from "@/lib/utils";
import type { User } from "@/types";

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  authenticating: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchCurrentUser() {
  return api.get<User>("/api/users/me");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = window.localStorage.getItem(api.tokenStorageKey);
    if (storedToken) {
      setToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const synchronizeUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
      setError(null);
    } catch (err) {
      console.error(err);
      setUser(null);
      setToken(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(api.tokenStorageKey);
      }
      setError("Session expired. Please log in again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void synchronizeUser();
  }, [synchronizeUser]);

  const login = useCallback(async (email: string, password: string) => {
    setAuthenticating(true);
    setError(null);
    try {
      const response = await api.post<AuthResponse>("/api/login", { email, password });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(api.tokenStorageKey, response.token);
      }
      setToken(response.token);
      setUser(response.user);
    } catch (err) {
      console.error(err);
      const message = "Invalid email or password";
      setError(message);
      throw new Error(message);
    } finally {
      setAuthenticating(false);
    }
  }, []);

  const register = useCallback(
    async (payload: { username: string; email: string; password: string }) => {
      setAuthenticating(true);
      setError(null);
      try {
        const response = await api.post<AuthResponse>("/api/register", payload);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(api.tokenStorageKey, response.token);
        }
        setToken(response.token);
        setUser(response.user);
      } catch (err) {
        console.error(err);
        const message = "Registration failed. Please try again.";
        setError(message);
        throw new Error(message);
      } finally {
        setAuthenticating(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(api.tokenStorageKey);
    }
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    await synchronizeUser();
  }, [synchronizeUser]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      authenticating,
      error,
      login,
      register,
      logout,
      refresh,
    }),
    [user, token, loading, authenticating, error, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
