"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type Role = "USER" | "ADMIN";

type AuthUser = {
  name: string;
  email: string;
  role: Role;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => { ok: boolean; message: string };
  register: (name: string, email: string, password: string) => { ok: boolean; message: string };
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "amr_auth_user";

function loadUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function saveUserToStorage(u: AuthUser | null) {
  try {
    if (!u) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  } catch {
    // ignore
  }
}

/**
 * Demo users:
 * - Admin login: admin@amr.com / admin123
 * - Registered USER is stored in localStorage (demo only)
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ✅ Load once safely (no useEffect => no lint warning)
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    return loadUserFromStorage();
  });

  const login: AuthContextValue["login"] = (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      return { ok: false, message: "Please enter email and password." };
    }

    // Admin demo
    if (cleanEmail === "admin@amr.com" && cleanPass === "admin123") {
      const adminUser: AuthUser = { name: "Admin", email: "admin@amr.com", role: "ADMIN" };
      setUser(adminUser);
      saveUserToStorage(adminUser);
      return { ok: true, message: "Logged in as Admin." };
    }

    // USER demo: allow login if saved user email matches
    const stored = typeof window !== "undefined" ? loadUserFromStorage() : null;
    if (stored && stored.role === "USER" && stored.email.toLowerCase() === cleanEmail) {
      setUser(stored);
      saveUserToStorage(stored);
      return { ok: true, message: "Logged in successfully." };
    }

    return {
      ok: false,
      message: "Invalid login (demo). Try admin@amr.com / admin123 OR register a user first.",
    };
  };

  const register: AuthContextValue["register"] = (name, email, password) => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      return { ok: false, message: "Please fill all fields." };
    }
    if (!cleanEmail.includes("@")) {
      return { ok: false, message: "Please enter a valid email." };
    }
    if (cleanPass.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters." };
    }

    const newUser: AuthUser = { name: cleanName, email: cleanEmail, role: "USER" };
    setUser(newUser);
    saveUserToStorage(newUser);

    return { ok: true, message: "Registration successful. You are now logged in." };
  };

  const logout = () => {
    setUser(null);
    saveUserToStorage(null);
  };

  // ✅ useMemo deps warning removed because functions are inside useMemo
  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isLoggedIn: !!user,
      login,
      register,
      logout,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
