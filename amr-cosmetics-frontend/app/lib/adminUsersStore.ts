export type AdminUser = {
  name: string;
  email: string; // normalized (lowercase)
  password: string; // demo only (localStorage)
  active: boolean;
  createdAt: number;
  updatedAt: number;
};

export const ADMIN_USERS_KEY = "amr_admin_users_v1";
export const ADMIN_USERS_UPDATED_EVENT = "amr-admin-users-updated";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function normalizeEmail(email: string): string {
  return (email ?? "").trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const e = normalizeEmail(email);
  return e.includes("@") && e.includes(".");
}

function cleanOne(x: unknown): AdminUser | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;

  const name = typeof o.name === "string" ? o.name.trim() : "Admin";
  const emailRaw = typeof o.email === "string" ? o.email : "";
  const email = normalizeEmail(emailRaw);

  const password = typeof o.password === "string" ? o.password : "";
  const active = typeof o.active === "boolean" ? o.active : true;

  const createdAtRaw = o.createdAt;
  const updatedAtRaw = o.updatedAt;

  const createdAt =
    typeof createdAtRaw === "number"
      ? createdAtRaw
      : typeof createdAtRaw === "string"
      ? Number(createdAtRaw)
      : NaN;

  const updatedAt =
    typeof updatedAtRaw === "number"
      ? updatedAtRaw
      : typeof updatedAtRaw === "string"
      ? Number(updatedAtRaw)
      : NaN;

  if (!email || !isValidEmail(email)) return null;
  if (!password || password.trim().length < 6) return null;

  const cAt = Number.isFinite(createdAt) ? createdAt : Date.now();
  const uAt = Number.isFinite(updatedAt) ? updatedAt : cAt;

  return {
    name: name || "Admin",
    email,
    password: password.trim(),
    active,
    createdAt: cAt,
    updatedAt: uAt,
  };
}

export function safeReadAdminUsers(): AdminUser[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ADMIN_USERS_KEY);
  const parsed = safeJsonParse<unknown>(raw, []);
  if (!Array.isArray(parsed)) return [];

  // de-dupe by email (keep latest updatedAt)
  const map = new Map<string, AdminUser>();
  for (const it of parsed) {
    const u = cleanOne(it);
    if (!u) continue;
    const prev = map.get(u.email);
    if (!prev || (u.updatedAt ?? 0) >= (prev.updatedAt ?? 0)) map.set(u.email, u);
  }

  return Array.from(map.values()).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export function safeWriteAdminUsers(items: AdminUser[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(items));

    // same-tab update
    try {
      window.dispatchEvent(new Event(ADMIN_USERS_UPDATED_EVENT));
    } catch {}
  } catch {
    // ignore
  }
}

export function getAdminUserByEmail(email: string): AdminUser | null {
  const clean = normalizeEmail(email);
  if (!clean) return null;
  const list = safeReadAdminUsers();
  return list.find((u) => u.email === clean) ?? null;
}

export function getActiveAdminUserByEmail(email: string): AdminUser | null {
  const u = getAdminUserByEmail(email);
  if (!u) return null;
  if (!u.active) return null;
  return u;
}

export function isEmailReservedForAdmin(email: string): boolean {
  const clean = normalizeEmail(email);
  if (!clean) return false;

  // default admin
  if (clean === "admin@amr.com") return true;

  // created admins
  return !!getAdminUserByEmail(clean);
}
