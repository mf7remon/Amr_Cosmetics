"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getAdminCouponByCode, type AdminCoupon } from "@/app/lib/couponsStore";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type CartStorageShape = {
  items: CartItem[];
  appliedCouponCode: string | null;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;

  totalItems: number;
  subtotal: number;

  appliedCoupon: AdminCoupon | null;
  discountAmount: number;
  total: number;

  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function getCartKey(email?: string | null) {
  const safe = (email ?? "").trim().toLowerCase();
  return safe ? `amr_cart_${safe}` : "amr_cart_guest";
}

function safeReadCart(key: string): CartStorageShape {
  if (typeof window === "undefined") return { items: [], appliedCouponCode: null };
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { items: [], appliedCouponCode: null };
    const parsed = JSON.parse(raw) as CartStorageShape;
    return {
      items: Array.isArray(parsed?.items) ? parsed.items : [],
      appliedCouponCode: typeof parsed?.appliedCouponCode === "string" ? parsed.appliedCouponCode : null,
    };
  } catch {
    return { items: [], appliedCouponCode: null };
  }
}

function safeWriteCart(key: string, value: CartStorageShape) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const email = user?.email ?? null;
  const cartKey = useMemo(() => getCartKey(email), [email]);

  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);

  const loadedRef = useRef(false);

  useEffect(() => {
    const stored = safeReadCart(cartKey);
    setItems(stored.items);
    setAppliedCouponCode(stored.appliedCouponCode);
    loadedRef.current = true;
  }, [cartKey]);

  useEffect(() => {
    if (!loadedRef.current) return;
    safeWriteCart(cartKey, { items, appliedCouponCode });
  }, [cartKey, items, appliedCouponCode]);

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
        .map((p) => (p.id === id ? { ...p, qty: Math.max(1, safeQty) } : p))
        .filter((p) => p.qty > 0)
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCouponCode(null);
  };

  const totalItems = useMemo(() => items.reduce((sum, p) => sum + p.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, p) => sum + p.price * p.qty, 0), [items]);

  const appliedCoupon = useMemo(() => {
    if (!appliedCouponCode) return null;
    const found = getAdminCouponByCode(appliedCouponCode);
    if (!found) return null;
    if (!found.active) return null;
    if (found.expiresAt && found.expiresAt < Date.now()) return null;
    return found;
  }, [appliedCouponCode]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (subtotal <= 0) return 0;

    if (appliedCoupon.type === "PERCENT") {
      const discount = Math.round((subtotal * appliedCoupon.value) / 100);
      return Math.max(0, discount);
    }

    const fixed = Math.round(appliedCoupon.value);
    return Math.max(0, Math.min(subtotal, fixed));
  }, [appliedCoupon, subtotal]);

  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  const applyCoupon: CartContextValue["applyCoupon"] = (code) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return { ok: false, message: "Please enter a coupon code." };
    if (subtotal <= 0) return { ok: false, message: "Cart is empty." };

    const found = getAdminCouponByCode(clean);
    if (!found) return { ok: false, message: "Invalid coupon code." };
    if (!found.active) return { ok: false, message: "This coupon is not active." };
    if (found.expiresAt && found.expiresAt < Date.now()) return { ok: false, message: "This coupon is expired." };

    setAppliedCouponCode(found.code);
    return { ok: true, message: `Coupon applied: ${found.code}` };
  };

  const removeCoupon = () => setAppliedCouponCode(null);

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
