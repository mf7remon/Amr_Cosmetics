// app/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ADMIN_USERS_KEY as ADMIN_USERS_KEY_V1,
  ADMIN_USERS_UPDATED_EVENT,
  getAdminUserByEmail,
  getActiveAdminUserByEmail,
  isEmailReservedForAdmin,
} from "@/app/lib/adminUsersStore";

type Role = "USER" | "ADMIN";

type AuthUser = {
  name: string;
  email: string;
  role: Role;
};

type StoredUser = {
  name: string;
  email: string;
  role: "USER";
  password?: string; // demo password store
  createdAt: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoggedIn: boolean;

  login: (email: string, password: string) => { ok: boolean; message: string };
  register: (name: string, email: string, password: string) => { ok: boolean; message: string };
  logout: () => void;

  requestPasswordResetOtp: (email: string) => { ok: boolean; message: string; otp?: string };
  resetPasswordWithOtp: (email: string, otp: string, newPassword: string) => { ok: boolean; message: string };
};

const AuthContext = createContext<AuthContextValue | null>(null);

// NEW keys (multi user + session)
const USERS_KEY = "amr_users";
const SESSION_KEY = "amr_session_user";

// Legacy key (older single user)
const LEGACY_KEY = "amr_auth_user";

// OTP reset store
const RESET_KEY = "amr_pw_reset";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  const e = normalizeEmail(email);
  return e.includes("@") && e.includes(".");
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  const list = safeJsonParse<unknown>(window.localStorage.getItem(USERS_KEY), []);
  if (!Array.isArray(list)) return [];
  return list.filter(Boolean) as StoredUser[];
}

function writeUsers(users: StoredUser[]) {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

function readSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const obj = safeJsonParse<unknown>(window.localStorage.getItem(SESSION_KEY), null);
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;

  const name = typeof o.name === "string" ? o.name : "";
  const email = typeof o.email === "string" ? o.email : "";
  const role = o.role === "ADMIN" || o.role === "USER" ? (o.role as Role) : "USER";

  if (!email) return null;
  return { name: name || "User", email, role };
}

function writeSession(u: AuthUser | null) {
  try {
    if (!u) window.localStorage.removeItem(SESSION_KEY);
    else window.localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  } catch {
    // ignore
  }
}

function migrateLegacyIfNeeded() {
  if (typeof window === "undefined") return;

  const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
  if (!legacyRaw) return;

  const legacy = safeJsonParse<any>(legacyRaw, null);
  if (!legacy || typeof legacy !== "object") return;

  const legacyEmail = normalizeEmail(String(legacy.email ?? ""));
  const legacyName = String(legacy.name ?? "User");
  const legacyRole = legacy.role === "ADMIN" ? "ADMIN" : "USER";

  // admin legacy ignore
  if (legacyRole === "ADMIN") {
    window.localStorage.removeItem(LEGACY_KEY);
    return;
  }

  // put into users list if not exists
  const users = readUsers();
  const exists = users.some((u) => normalizeEmail(u.email) === legacyEmail);

  if (legacyEmail && !exists) {
    users.push({
      name: legacyName,
      email: legacyEmail,
      role: "USER",
      password: typeof legacy.password === "string" ? legacy.password : undefined,
      createdAt: Date.now(),
    });
    writeUsers(users);
  }

  // if legacy was logged in, keep session
  if (legacyEmail) {
    const session: AuthUser = { name: legacyName, email: legacyEmail, role: "USER" };
    writeSession(session);
  }

  window.localStorage.removeItem(LEGACY_KEY);
}

function getDefaultAdminUser(): AuthUser {
  return { name: "Admin", email: "admin@amr.com", role: "ADMIN" };
}

function readResetMap(): Record<string, { otp: string; expiresAt: number }> {
  if (typeof window === "undefined") return {};
  const obj = safeJsonParse<unknown>(window.localStorage.getItem(RESET_KEY), {});
  if (!obj || typeof obj !== "object") return {};
  return obj as Record<string, { otp: string; expiresAt: number }>;
}

function writeResetMap(map: Record<string, { otp: string; expiresAt: number }>) {
  try {
    window.localStorage.setItem(RESET_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function generateOtp(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    migrateLegacyIfNeeded();
    return readSession();
  });

  const logout = () => {
    setUser(null);
    writeSession(null);
  };

  // ✅ NEW: re-validate current ADMIN session when admin users change (deactivate/delete => instant logout)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const validateAdminSession = () => {
      const current = readSession();
      if (!current) return;

      if (current.role !== "ADMIN") return;

      const email = normalizeEmail(current.email);

      // default admin always valid in demo
      if (email === "admin@amr.com") return;

      // created admin must exist AND be active
      const active = getActiveAdminUserByEmail(email);
      if (!active) {
        // instant kick out
        setUser(null);
        writeSession(null);
      }
    };

    validateAdminSession();

    const onAdminUsersUpdated = () => validateAdminSession();

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === ADMIN_USERS_KEY_V1 || e.key === SESSION_KEY) validateAdminSession();
    };

    window.addEventListener(ADMIN_USERS_UPDATED_EVENT, onAdminUsersUpdated as any);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(ADMIN_USERS_UPDATED_EVENT, onAdminUsersUpdated as any);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const login: AuthContextValue["login"] = (email, password) => {
    const cleanEmail = normalizeEmail(email);
    const cleanPass = (password || "").trim();

    if (!cleanEmail || !cleanPass) {
      return { ok: false, message: "Please enter email and password." };
    }

    // ✅ Default Admin (hardcoded)
    if (cleanEmail === "admin@amr.com") {
      if (cleanPass !== "admin123") return { ok: false, message: "Wrong password." };

      const adminUser = getDefaultAdminUser();
      setUser(adminUser);
      writeSession(adminUser);
      return { ok: true, message: "Logged in as Admin." };
    }

    // ✅ Admin Panel created ADMIN accounts (must be active)
    const anyAdmin = getAdminUserByEmail(cleanEmail);
    if (anyAdmin) {
      if (!anyAdmin.active) return { ok: false, message: "This admin account is deactivated." };
      const pass = String(anyAdmin.password ?? "").trim();
      if (!pass) return { ok: false, message: "Password not set for this admin account." };
      if (pass !== cleanPass) return { ok: false, message: "Wrong password." };

      const nextAdmin: AuthUser = {
        name: String(anyAdmin.name ?? "Admin User") || "Admin User",
        email: cleanEmail,
        role: "ADMIN",
      };

      setUser(nextAdmin);
      writeSession(nextAdmin);
      return { ok: true, message: "Logged in as Admin." };
    }

    // ✅ USER login (multi-user)
    const users = readUsers();
    const found = users.find((u) => normalizeEmail(u.email) === cleanEmail);

    if (!found) {
      return { ok: false, message: "Account not found. Please register first." };
    }

    // verify password if exists
    if (typeof found.password === "string" && found.password.length > 0) {
      if (found.password !== cleanPass) return { ok: false, message: "Wrong password." };
    }

    const nextUser: AuthUser = { name: found.name, email: cleanEmail, role: "USER" };
    setUser(nextUser);
    writeSession(nextUser);

    if (!found.password) {
      return {
        ok: true,
        message: "Logged in. Note: this is a legacy account. Please set password from Forgot Password.",
      };
    }

    return { ok: true, message: "Logged in successfully." };
  };

  const register: AuthContextValue["register"] = (name, email, password) => {
    const cleanName = (name || "").trim();
    const cleanEmail = normalizeEmail(email);
    const cleanPass = (password || "").trim();

    if (!cleanName || !cleanEmail || !cleanPass) return { ok: false, message: "Please fill all fields." };
    if (!isValidEmail(cleanEmail)) return { ok: false, message: "Please enter a valid email." };
    if (cleanPass.length < 6) return { ok: false, message: "Password must be at least 6 characters." };

    // ✅ block default + created admin emails from being registered as USER
    if (isEmailReservedForAdmin(cleanEmail)) {
      return { ok: false, message: "This email is reserved for Admin." };
    }

    const users = readUsers();
    const exists = users.some((u) => normalizeEmail(u.email) === cleanEmail);
    if (exists) return { ok: false, message: "Email already registered. Please login." };

    const newUser: StoredUser = {
      name: cleanName,
      email: cleanEmail,
      role: "USER",
      password: cleanPass,
      createdAt: Date.now(),
    };

    writeUsers([...users, newUser]);

    const sessionUser: AuthUser = { name: cleanName, email: cleanEmail, role: "USER" };
    setUser(sessionUser);
    writeSession(sessionUser);

    return { ok: true, message: "Registration successful. You are now logged in." };
  };

  const requestPasswordResetOtp: AuthContextValue["requestPasswordResetOtp"] = (email) => {
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) return { ok: false, message: "Please enter your email." };
    if (!isValidEmail(cleanEmail)) return { ok: false, message: "Please enter a valid email." };

    // ✅ disable reset for any admin (default + created) in demo
    if (isEmailReservedForAdmin(cleanEmail)) {
      return { ok: false, message: "Admin password reset is disabled in demo." };
    }

    const users = readUsers();
    const found = users.find((u) => normalizeEmail(u.email) === cleanEmail);
    if (!found) return { ok: false, message: "Account not found." };

    const otp = generateOtp();
    const map = readResetMap();
    map[cleanEmail] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
    writeResetMap(map);

    return { ok: true, message: "OTP generated (demo). Use it within 5 minutes.", otp };
  };

  const resetPasswordWithOtp: AuthContextValue["resetPasswordWithOtp"] = (email, otp, newPassword) => {
    const cleanEmail = normalizeEmail(email);
    const cleanOtp = (otp || "").trim();
    const cleanPass = (newPassword || "").trim();

    if (!cleanEmail || !cleanOtp || !cleanPass) return { ok: false, message: "Please fill all fields." };
    if (cleanPass.length < 6) return { ok: false, message: "Password must be at least 6 characters." };

    // ✅ block admin resets in demo
    if (isEmailReservedForAdmin(cleanEmail)) {
      return { ok: false, message: "Admin password reset is disabled in demo." };
    }

    const map = readResetMap();
    const entry = map[cleanEmail];
    if (!entry) return { ok: false, message: "OTP not found. Please request OTP again." };

    if (Date.now() > entry.expiresAt) {
      delete map[cleanEmail];
      writeResetMap(map);
      return { ok: false, message: "OTP expired. Please request OTP again." };
    }

    if (entry.otp !== cleanOtp) return { ok: false, message: "Wrong OTP." };

    const users = readUsers();
    const idx = users.findIndex((u) => normalizeEmail(u.email) === cleanEmail);
    if (idx === -1) return { ok: false, message: "Account not found." };

    const updated = [...users];
    updated[idx] = { ...updated[idx], password: cleanPass };
    writeUsers(updated);

    delete map[cleanEmail];
    writeResetMap(map);

    return { ok: true, message: "Password updated. Now login with new password." };
  };

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isLoggedIn: !!user,
      login,
      register,
      logout,
      requestPasswordResetOtp,
      resetPasswordWithOtp,
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
