export type AdminCouponType = "PERCENT" | "FIXED";

export type AdminCoupon = {
  id: string;
  title: string;
  code: string;
  type: AdminCouponType;
  value: number;
  active: boolean;
  expiresAt: number;
  createdAt: number;
};

export const ADMIN_COUPONS_KEY = "amr_admin_coupons";

// ✅ same-tab listeners (Admin dashboard / wheel etc.)
export const ADMIN_COUPONS_UPDATED_EVENT = "amr-admin-coupons-updated";

export function safeReadAdminCoupons(): AdminCoupon[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ADMIN_COUPONS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdminCoupon[]) : [];
  } catch {
    return [];
  }
}

export function safeWriteAdminCoupons(items: AdminCoupon[]): void {
  try {
    window.localStorage.setItem(ADMIN_COUPONS_KEY, JSON.stringify(items));

    // ✅ same tab update
    try {
      window.dispatchEvent(new Event(ADMIN_COUPONS_UPDATED_EVENT));
    } catch {}
  } catch {}
}

export function getAdminCouponByCode(code: string): AdminCoupon | null {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  const list = safeReadAdminCoupons();
  const found = list.find((c) => (c.code ?? "").toUpperCase() === clean);
  return found ?? null;
}

// ✅ NEW: only ACTIVE + not expired
export function safeReadActiveAdminCoupons(now = Date.now()): AdminCoupon[] {
  const list = safeReadAdminCoupons();
  return [...list]
    .filter((c) => !!c.active && Number(c.expiresAt) > now)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

// ✅ NEW: validate code strictly (ACTIVE + not expired)
export function getActiveAdminCouponByCode(code: string, now = Date.now()): AdminCoupon | null {
  const clean = (code ?? "").trim().toUpperCase();
  if (!clean) return null;

  const list = safeReadAdminCoupons();
  const found = list.find((c) => (c.code ?? "").toUpperCase() === clean);

  if (!found) return null;
  if (!found.active) return null;
  if (!(Number(found.expiresAt) > now)) return null;

  const v = Number(found.value);
  if (!Number.isFinite(v) || v <= 0) return null;

  return found;
}
