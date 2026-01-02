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
  } catch {}
}

export function getAdminCouponByCode(code: string): AdminCoupon | null {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  const list = safeReadAdminCoupons();
  const found = list.find((c) => (c.code ?? "").toUpperCase() === clean);
  return found ?? null;
}
