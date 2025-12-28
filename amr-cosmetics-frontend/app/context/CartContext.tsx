"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type Coupon = {
  code: string;
  type: "PERCENT";
  value: number; // e.g. 10 means 10%
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

/**
 * Demo coupon list (later: from Spin or backend)
 */
const COUPONS: Coupon[] = [
  { code: "AMR5", type: "PERCENT", value: 5 },
  { code: "AMR10", type: "PERCENT", value: 10 },
  { code: "GLOW15", type: "PERCENT", value: 15 },
  { code: "BEAUTY20", type: "PERCENT", value: 20 },
];

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

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
    setAppliedCoupon(null);
  };

  const totalItems = useMemo(() => items.reduce((sum, p) => sum + p.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, p) => sum + p.price * p.qty, 0), [items]);

  const applyCoupon: CartContextValue["applyCoupon"] = (code) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return { ok: false, message: "Please enter a coupon code." };
    if (subtotal <= 0) return { ok: false, message: "Cart is empty." };

    const found = COUPONS.find((c) => c.code === clean);
    if (!found) return { ok: false, message: "Invalid coupon code." };

    setAppliedCoupon(found);
    return { ok: true, message: `Coupon applied: ${found.code} (${found.value}%)` };
  };

  const removeCoupon = () => setAppliedCoupon(null);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const discount = Math.round((subtotal * appliedCoupon.value) / 100);
    return Math.max(0, discount);
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
