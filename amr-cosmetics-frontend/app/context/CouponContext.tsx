"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Coupon = {
  id: string;
  title: string;
  code: string;
  discount: number; // percentage (ex: 10)
  expiresAt: number; // timestamp
  used: boolean;
  createdAt?: number; // for sorting / display
};

type CouponContextValue = {
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => void;
  markUsed: (id: string) => void;
  clearCoupons: () => void;
};

const CouponContext = createContext<CouponContextValue | null>(null);
const STORAGE_KEY = "amr_coupons";

function safeReadCoupons(): Coupon[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CouponProvider({ children }: { children: React.ReactNode }) {
  // ✅ read localStorage without useEffect (fix lint error)
  const [coupons, setCoupons] = useState<Coupon[]>(() => safeReadCoupons());

  // ✅ persist
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
    } catch {}
  }, [coupons]);

  const value = useMemo<CouponContextValue>(
    () => ({
      coupons,
      addCoupon: (coupon) => setCoupons([coupon]),
      markUsed: (id) =>
        setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, used: true } : c))),
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
