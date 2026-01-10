"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export type CouponKind = "PERCENT" | "FIXED";

export type Coupon = {
  id: string;
  title: string;
  code: string;
  kind: CouponKind;
  value: number;
  expiresAt: number;
  used: boolean;
  createdAt: number;
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

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeReadCoupons(key: string): Coupon[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return (parsed as unknown[])
      .map((c) => {
        if (!c || typeof c !== "object") return null;
        const obj = c as Record<string, unknown>;

        const id = typeof obj.id === "string" ? obj.id : "";
        const title = typeof obj.title === "string" ? obj.title : "";
        const code = typeof obj.code === "string" ? obj.code : "";

        const kind = obj.kind === "FIXED" || obj.kind === "PERCENT" ? (obj.kind as CouponKind) : "PERCENT";

        const valueRaw = obj.value;
        const valueNum = typeof valueRaw === "number" ? valueRaw : typeof valueRaw === "string" ? Number(valueRaw) : NaN;

        const expiresRaw = obj.expiresAt;
        const expiresAt = typeof expiresRaw === "number" ? expiresRaw : typeof expiresRaw === "string" ? Number(expiresRaw) : NaN;

        const usedRaw = obj.used;
        const used = typeof usedRaw === "boolean" ? usedRaw : typeof usedRaw === "string" ? usedRaw === "true" : false;

        const createdRaw = obj.createdAt;
        const createdAt = typeof createdRaw === "number" ? createdRaw : typeof createdRaw === "string" ? Number(createdRaw) : NaN;

        if (!id || !title || !code) return null;
        if (!Number.isFinite(valueNum) || valueNum <= 0) return null;
        if (!Number.isFinite(expiresAt)) return null;

        const safeCreatedAt = Number.isFinite(createdAt) ? createdAt : Date.now();

        return {
          id,
          title,
          code: code.trim().toUpperCase(),
          kind,
          value: Math.max(1, Math.floor(valueNum)),
          expiresAt,
          used,
          createdAt: safeCreatedAt,
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

  useEffect(() => {
    setHydrated(false);
    const next = safeReadCoupons(storageKey);
    setCoupons(next);
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    safeWriteCoupons(storageKey, coupons);
  }, [hydrated, storageKey, coupons]);

  const value = useMemo<CouponContextValue>(
    () => ({
      coupons,

      // ✅ keep only latest coupon (your requirement)
      addCoupon: (coupon) => setCoupons([coupon]),

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
