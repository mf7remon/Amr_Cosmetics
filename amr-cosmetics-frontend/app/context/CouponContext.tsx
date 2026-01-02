"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export type Coupon = {
  id: string;
  title: string;
  code: string;
  discount: number;
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

function getUserCouponKey(email?: string | null) {
  const safe = (email ?? "").trim().toLowerCase();
  return safe ? `amr_user_coupon_${safe}` : "amr_user_coupon_guest";
}

function safeReadCoupons(key: string): Coupon[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Coupon[]) : [];
  } catch {
    return [];
  }
}

function safeWriteCoupons(key: string, coupons: Coupon[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(coupons));
  } catch {}
}

export function CouponProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const email = user?.email ?? null;

  const storageKey = useMemo(() => getUserCouponKey(email), [email]);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    const stored = safeReadCoupons(storageKey);
    setCoupons(Array.isArray(stored) ? stored : []);
    loadedRef.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!loadedRef.current) return;
    safeWriteCoupons(storageKey, coupons);
  }, [storageKey, coupons]);

  const value = useMemo<CouponContextValue>(
    () => ({
      coupons,
      addCoupon: (coupon) => setCoupons([coupon]), // latest only
      markUsed: (id) => setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, used: true } : c))),
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
