"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  const [coupons, setCoupons] = useState<Coupon[]>(() => safeReadCoupons());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
    } catch {}
  }, [coupons]);

  const value = useMemo<CouponContextValue>(
    () => ({
      coupons,
      addCoupon: (coupon) => setCoupons([coupon]), // ✅ latest only
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
