"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export type Coupon = {
  id: string;
  title: string;
  code: string;
  discount: number; // % or fixed
  expiresAt: number;
  used: boolean;
  createdAt?: number;
};

type CouponContextValue = {
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => void;
  markUsed: (id: string) => void;
  clearCoupons: () => void;
};

const CouponContext = createContext<CouponContextValue | null>(null);

// ✅ Per-user storage key
const COUPON_PREFIX = "amr_coupons_v1";

function makeCouponsKey(email?: string | null) {
  const clean = (email ?? "").trim().toLowerCase();
  return clean ? `${COUPON_PREFIX}:${clean}` : `${COUPON_PREFIX}:guest`;
}

function safeReadCoupons(key: string): Coupon[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // light cleanup
    return (parsed as Coupon[])
      .map((c) => {
        if (!c || typeof c !== "object") return null;
        const obj = c as Record<string, unknown>;

        const id = typeof obj.id === "string" ? obj.id : "";
        const title = typeof obj.title === "string" ? obj.title : "";
        const code = typeof obj.code === "string" ? obj.code : "";
        const discount =
          typeof obj.discount === "number"
            ? obj.discount
            : typeof obj.discount === "string"
            ? Number(obj.discount)
            : NaN;
        const expiresAt =
          typeof obj.expiresAt === "number"
            ? obj.expiresAt
            : typeof obj.expiresAt === "string"
            ? Number(obj.expiresAt)
            : NaN;
        const used =
          typeof obj.used === "boolean"
            ? obj.used
            : typeof obj.used === "string"
            ? obj.used === "true"
            : false;
        const createdAt =
          typeof obj.createdAt === "number"
            ? obj.createdAt
            : typeof obj.createdAt === "string"
            ? Number(obj.createdAt)
            : undefined;

        if (!id || !title || !code || Number.isNaN(discount) || Number.isNaN(expiresAt)) return null;

        return {
          id,
          title,
          code,
          discount,
          expiresAt,
          used,
          createdAt,
        } satisfies Coupon;
      })
      .filter((x): x is Coupon => x !== null);
  } catch {
    return [];
  }
}

function safeWriteCoupons(key: string, coupons: Coupon[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(coupons));
  } catch {
    // ignore
  }
}

export function CouponProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const storageKey = useMemo(() => makeCouponsKey(user?.email ?? null), [user?.email]);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // ✅ load coupons when user changes (or guest)
  useEffect(() => {
    setHydrated(false);
    const next = safeReadCoupons(storageKey);
    setCoupons(next);
    setHydrated(true);
  }, [storageKey]);

  // ✅ persist coupons (after hydrate only)
  useEffect(() => {
    if (!hydrated) return;
    safeWriteCoupons(storageKey, coupons);
  }, [hydrated, storageKey, coupons]);

  const value = useMemo<CouponContextValue>(
    () => ({
      coupons,

      // ✅ keep only latest coupon (your requirement)
      addCoupon: (coupon) => setCoupons([coupon]),

      markUsed: (id) =>
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, used: true } : c))
        ),

      clearCoupons: () => setCoupons([]),
    }),
    [coupons]
  );

  return <CouponContext.Provider value={value}>{children}</CouponContext.Provider>;
}

export function useCoupons() {
  const ctx = useContext(CouponContext);
  if (!ctx) throw new Error("useCoupons must be used inside CouponProvider");
  return ctx;
}
