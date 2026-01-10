"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getActiveAdminCouponByCode } from "@/app/lib/couponsStore";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type Coupon = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
};

type StoredCart = {
  items: CartItem[];
  appliedCoupon: Coupon | null;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;

  totalItems: number;
  subtotal: number;

  appliedCoupon: Coupon | null;
  discountAmount: number;
  total: number;

  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const CART_PREFIX = "amr_cart_v1";

function makeCartKey(email?: string | null) {
  const clean = (email ?? "").trim().toLowerCase();
  return clean ? `${CART_PREFIX}:${clean}` : `${CART_PREFIX}:guest`;
}

function toCartCoupon(admin: { code: string; type: "PERCENT" | "FIXED"; value: number }): Coupon {
  const v = Number(admin.value);
  const safeV = Number.isFinite(v) ? Math.max(1, Math.floor(v)) : 0;
  return {
    code: String(admin.code ?? "").trim().toUpperCase(),
    type: admin.type === "FIXED" ? "FIXED" : "PERCENT",
    value: safeV,
  };
}

function safeReadCart(key: string): StoredCart {
  if (typeof window === "undefined") return { items: [], appliedCoupon: null };

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { items: [], appliedCoupon: null };

    const parsed = JSON.parse(raw) as Partial<StoredCart> | null;
    const items = Array.isArray(parsed?.items) ? (parsed?.items as CartItem[]) : [];
    const appliedCoupon = parsed?.appliedCoupon ?? null;

    // basic cleanup
    const cleanItems = items
      .map((x) => {
        const id = typeof x?.id === "string" ? x.id : "";
        const name = typeof x?.name === "string" ? x.name : "";
        const price = typeof x?.price === "number" ? x.price : Number(x?.price);
        const qty = typeof x?.qty === "number" ? x.qty : Number(x?.qty);

        if (!id || !name || !Number.isFinite(price) || !Number.isFinite(qty)) return null;

        return {
          id,
          name,
          price,
          qty: Math.max(1, Math.floor(qty)),
        } as CartItem;
      })
      .filter((v): v is CartItem => v !== null);

    // ✅ validate coupon against ACTIVE admin coupons (not expired)
    let cleanCoupon: Coupon | null = null;
    if (appliedCoupon && typeof (appliedCoupon as any).code === "string") {
      const code = String((appliedCoupon as any).code).trim().toUpperCase();
      const found = getActiveAdminCouponByCode(code);
      if (found) cleanCoupon = toCartCoupon(found);
    }

    return { items: cleanItems, appliedCoupon: cleanCoupon };
  } catch {
    return { items: [], appliedCoupon: null };
  }
}

function safeWriteCart(key: string, data: StoredCart) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const storageKey = useMemo(() => makeCartKey(user?.email ?? null), [user?.email]);

  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // ✅ hydrate on key change (user switch) and block writing until hydrated
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(false);
    const stored = safeReadCart(storageKey);
    setItems(stored.items);
    setAppliedCoupon(stored.appliedCoupon);
    setHydrated(true);
  }, [storageKey]);

  // ✅ persist to localStorage (after hydrated only)
  useEffect(() => {
    if (!hydrated) return;
    safeWriteCart(storageKey, { items, appliedCoupon });
  }, [hydrated, storageKey, items, appliedCoupon]);

  const addItem: CartContextValue["addItem"] = (item) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + 1 } : p));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItem: CartContextValue["removeItem"] = (id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const updateQty: CartContextValue["updateQty"] = (id, qty) => {
    const safeQty = Number.isFinite(qty) ? qty : 1;
    setItems((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, qty: Math.max(1, Math.floor(safeQty)) } : p))
        .filter((p) => p.qty > 0)
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const totalItems = useMemo(() => items.reduce((sum, p) => sum + p.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, p) => sum + p.price * p.qty, 0), [items]);

  const applyCoupon: CartContextValue["applyCoupon"] = (code) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return { ok: false, message: "Please enter a coupon code." };
    if (subtotal <= 0) return { ok: false, message: "Cart is empty." };

    const found = getActiveAdminCouponByCode(clean);
    if (!found) return { ok: false, message: "Invalid / inactive / expired coupon." };

    const next = toCartCoupon(found);
    setAppliedCoupon(next);

    const show = next.type === "PERCENT" ? `${next.value}%` : `৳ ${next.value}`;
    return { ok: true, message: `Coupon applied: ${next.code} (${show})` };
  };

  const removeCoupon = () => setAppliedCoupon(null);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;

    if (appliedCoupon.type === "PERCENT") {
      const discount = Math.round((subtotal * appliedCoupon.value) / 100);
      return Math.max(0, discount);
    }

    // FIXED
    const fixed = Math.max(0, Math.floor(appliedCoupon.value));
    return Math.min(subtotal, fixed);
  }, [appliedCoupon, subtotal]);

  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    totalItems,
    subtotal,
    appliedCoupon,
    discountAmount,
    total,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider />");
  return ctx;
}
