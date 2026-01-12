"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

import {
  ADMIN_USERS_KEY,
  ADMIN_USERS_UPDATED_EVENT,
  AdminUser,
  isValidEmail,
  normalizeEmail,
  safeReadAdminUsers,
  safeWriteAdminUsers,
} from "@/app/lib/adminUsersStore";

type FormState = {
  name: string;
  email: string;
  password: string;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  active: true,
};

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readNormalUserEmails(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = window.localStorage.getItem("amr_users");
  const parsed = safeJsonParse<unknown>(raw, []);
  if (!Array.isArray(parsed)) return new Set();
  const set = new Set<string>();
  for (const it of parsed) {
    if (!it || typeof it !== "object") continue;
    const o = it as any;
    const e = typeof o.email === "string" ? normalizeEmail(o.email) : "";
    if (e) set.add(e);
  }
  return set;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  const [items, setItems] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  // ✅ guard
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (user?.role !== "ADMIN") {
      router.replace("/");
      return;
    }
  }, [isLoggedIn, user?.role, router]);

  // ✅ load + sync
  useEffect(() => {
    const load = () => setItems(safeReadAdminUsers());
    load();

    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_USERS_KEY) load();
    };

    window.addEventListener(ADMIN_USERS_UPDATED_EVENT, onCustom as any);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(ADMIN_USERS_UPDATED_EVENT, onCustom as any);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return copy;
  }, [items]);

  const persist = (next: AdminUser[], msg?: string) => {
    setItems(next);
    safeWriteAdminUsers(next);
    if (msg) setStatus(msg);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingEmail(null);
  };

  const submit = () => {
    setStatus("");

    const name = (form.name || "").trim() || "Admin";
    const email = normalizeEmail(form.email);
    const password = (form.password || "").trim();

    if (!email) return setStatus("Email required");
    if (!isValidEmail(email)) return setStatus("Valid email required");
    if (email === "admin@amr.com") return setStatus("This email is reserved (default admin).");
    if (password.length < 6) return setStatus("Password must be at least 6 characters.");

    // prevent conflicts with normal users
    const normalUsers = readNormalUserEmails();
    if (normalUsers.has(email)) {
      return setStatus("This email already exists as a normal USER. Use a different email for Admin.");
    }

    const now = Date.now();

    // uniqueness check
    const existsOther = sorted.some((u) => u.email === email && u.email !== (editingEmail ?? ""));
    if (existsOther) return setStatus("Admin email already exists.");

    if (!editingEmail) {
      const newItem: AdminUser = {
        name,
        email,
        password,
        active: !!form.active,
        createdAt: now,
        updatedAt: now,
      };

      persist([newItem, ...sorted], "✅ Admin account created");
      resetForm();
      return;
    }

    const updated = sorted.map((u) => {
      if (u.email !== editingEmail) return u;
      return {
        ...u,
        name,
        email,
        password,
        active: !!form.active,
        updatedAt: now,
      };
    });

    // if email changed, ensure list has only new email (dedupe)
    const map = new Map<string, AdminUser>();
    for (const u of updated) {
      const prev = map.get(u.email);
      if (!prev || (u.updatedAt ?? 0) >= (prev.updatedAt ?? 0)) map.set(u.email, u);
    }

    persist(Array.from(map.values()), "✅ Admin account updated");
    resetForm();
  };

  const onEdit = (u: AdminUser) => {
    setEditingEmail(u.email);
    setForm({
      name: u.name ?? "Admin",
      email: u.email ?? "",
      password: u.password ?? "",
      active: !!u.active,
    });
    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = (email: string) => {
    persist(sorted.filter((u) => u.email !== email), "✅ Admin account deleted");
  };

  const toggleActive = (email: string) => {
    const next = sorted.map((u) => (u.email === email ? { ...u, active: !u.active, updatedAt: Date.now() } : u));
    persist(next);
  };

  const copyCred = async (email: string, password: string) => {
    try {
      await navigator.clipboard.writeText(`${email} / ${password}`);
      setStatus("✅ Copied credentials");
    } catch {
      setStatus("Copy failed");
    }
  };

  if (!isLoggedIn || user?.role !== "ADMIN") return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-pink-500">Admin • Admin Users</h1>
          <p className="text-gray-400 mt-1">
            Create/edit Admin login credentials (demo: stored in localStorage).
          </p>
          {status ? <p className="text-sm mt-2 text-pink-400">{status}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FORM */}
        <div className="border border-zinc-800 bg-zinc-900 rounded p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingEmail ? "Edit Admin Account" : "Create Admin Account"}
          </h2>

          <label className="block text-sm text-gray-300 mb-1">Name</label>
          <input
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="Admin Name"
          />

          <label className="block text-sm text-gray-300 mb-1">Email</label>
          <input
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            placeholder="manager@amr.com"
          />

          <label className="block text-sm text-gray-300 mb-1">Password</label>
          <input
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            placeholder="min 6 chars"
          />

          <label className="flex items-center gap-2 text-sm text-gray-300 mb-6">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
            />
            Active
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={submit}
              className="bg-pink-600 px-6 py-2 rounded text-white hover:opacity-90"
            >
              {editingEmail ? "Save" : "Create"}
            </button>

            {editingEmail ? (
              <button
                type="button"
                onClick={resetForm}
                className="border border-zinc-700 px-6 py-2 rounded hover:border-pink-500"
              >
                Cancel
              </button>
            ) : null}
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Note: default admin is <span className="text-white">admin@amr.com / admin123</span> (cannot be replaced).
          </p>
        </div>

        {/* LIST */}
        <div className="border border-zinc-800 bg-zinc-900 rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Admin Accounts</h2>

          {/* Default admin card */}
          <div className="border border-zinc-800 rounded p-4 bg-zinc-950 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Default Admin</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Email: <span className="text-white">admin@amr.com</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Password: <span className="text-white">admin123</span>
                </p>
                <p className="text-sm mt-2">
                  Status: <span className="text-green-400 font-semibold">Active</span>
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => copyCred("admin@amr.com", "admin123")}
                  className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {sorted.length === 0 ? (
            <p className="text-gray-400">No created admin accounts yet.</p>
          ) : (
            <div className="space-y-4">
              {sorted.map((u) => (
                <div key={u.email} className="border border-zinc-800 rounded p-4 bg-zinc-950">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg">{u.name || "Admin"}</h3>
                      <p className="text-sm text-gray-400 mt-1 break-all">
                        Email: <span className="text-white">{u.email}</span>
                      </p>
                      <p className="text-sm text-gray-400 mt-1 break-all">
                        Password: <span className="text-white">{u.password}</span>
                      </p>
                      <p className="text-sm mt-2">
                        Status:{" "}
                        {u.active ? (
                          <span className="text-green-400 font-semibold">Active</span>
                        ) : (
                          <span className="text-red-400 font-semibold">Inactive</span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => copyCred(u.email, u.password)}
                        className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(u)}
                        className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(u.email)}
                        className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                      >
                        {u.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(u.email)}
                        className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            Only these admin accounts (default + created) can login as ADMIN.
          </p>
        </div>
      </div>
    </div>
  );
}
