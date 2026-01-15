// app/checkout/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import * as OrdersStore from "@/app/lib/ordersStore";
import { safeReadProducts, safeWriteProducts } from "@/app/lib/productsStore";

type ShippingZone = "INSIDE_DHAKA" | "OUTSIDE_DHAKA";

const USER_COUPON_PREFIX = "amr_coupons_v1";

function makeUserCouponsKey(email?: string | null) {
  const clean = (email ?? "").trim().toLowerCase();
  return clean ? `${USER_COUPON_PREFIX}:${clean}` : `${USER_COUPON_PREFIX}:guest`;
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readMyCoupon(email?: string | null, now = Date.now()) {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(makeUserCouponsKey(email));
  const list = safeJsonParse<unknown>(raw, []);
  if (!Array.isArray(list) || list.length === 0) return null;

  const first = list[0];
  if (!first || typeof first !== "object") return null;
  const o = first as Record<string, unknown>;

  const code = typeof o.code === "string" ? o.code.trim().toUpperCase() : "";
  const kind = o.kind === "FIXED" || o.kind === "PERCENT" ? (o.kind as "FIXED" | "PERCENT") : "PERCENT";
  const value = typeof o.value === "number" ? o.value : Number(o.value);
  const expiresAt = typeof o.expiresAt === "number" ? o.expiresAt : Number(o.expiresAt);
  const used = typeof o.used === "boolean" ? o.used : String(o.used) === "true";

  if (!code) return null;
  if (!Number.isFinite(value) || value <= 0) return null;
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null;
  if (used) return null;

  return { code, kind, value, expiresAt };
}

const PM_SSL = "SSLCommerz (bKash/rocket/Nagad/bank)";
const PM_COD = "Cash on Delivery";

export default function CheckoutPage() {
  const {
    items,
    subtotal,
    appliedCoupon,
    discountAmount,
    total,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCart();

  const { user, isLoggedIn } = useAuth();

  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const [myCoupon, setMyCoupon] = useState<ReturnType<typeof readMyCoupon> | null>(null);

  useEffect(() => {
    const c = readMyCoupon(user?.email ?? null);
    setMyCoupon(c);
  }, [user?.email]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  const [shippingZone, setShippingZone] = useState<ShippingZone>("INSIDE_DHAKA");
  const shippingFee = shippingZone === "INSIDE_DHAKA" ? 50 : 100;

  // ✅ now 2 payment options
  const [paymentMethod, setPaymentMethod] = useState(PM_SSL);

  const grandTotal = useMemo(() => Math.max(0, total + shippingFee), [total, shippingFee]);

  function handleApplyCoupon(code?: string) {
    const res = applyCoupon((code ?? couponInput) as string);
    setCouponMsg(res.message);
  }

  function handlePlaceOrder() {
    if (items.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      alert("Please fill in all delivery details.");
      return;
    }

    // ✅ STOCK CHECK (before placing order)
    const latestProducts = safeReadProducts();
    const byId = new Map(latestProducts.map((p) => [p.id, p]));

    const bad = items.find((it) => {
      const p = byId.get(it.id);
      if (!p) return true;

      const raw = (p as any).stock;
      const stockNum = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : 999;
      const stock = Number.isFinite(stockNum) ? Math.max(0, Math.floor(stockNum)) : 999;

      return stock < it.qty;
    });

    if (bad) {
      const p = byId.get(bad.id);
      const nm = p?.title ?? bad.name;

      const raw = (p as any)?.stock;
      const stockNum = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : 0;
      const stock = Number.isFinite(stockNum) ? Math.max(0, Math.floor(stockNum)) : 0;

      alert(
        stock <= 0
          ? `Out of stock: ${nm}\nPlease remove it from cart.`
          : `Not enough stock: ${nm}\nAvailable: ${stock}, You selected: ${bad.qty}`
      );
      return;
    }

    const now = Date.now();
    const orderId = OrdersStore.makeOrderId();

    // ✅ COD হলে PENDING, SSL হলে PROCESSING
    const initialStatus: OrdersStore.OrderStatus = paymentMethod === PM_SSL ? "PROCESSING" : "PENDING";

    const order: OrdersStore.Order = {
      id: orderId,

      customerName: name.trim(),
      customerEmail: isLoggedIn && user?.email ? user.email : "guest",
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),

      paymentMethod: paymentMethod,

      items: items.map((it) => ({
        id: it.id,
        name: it.name,
        price: it.price,
        qty: it.qty,
      })),

      subtotal: subtotal,
      discountAmount: discountAmount,
      total: grandTotal,

      // ✅ FIX: keep correct type
      coupon: appliedCoupon
        ? { code: appliedCoupon.code, type: appliedCoupon.type, value: appliedCoupon.value }
        : null,

      status: initialStatus,
      createdAt: now,
      updatedAt: now,
    };

    OrdersStore.addOrderToStorage(order);

    // ✅ DECREASE STOCK after successful order
    const cartQtyById = new Map(items.map((it) => [it.id, it.qty]));

    const nextProducts = latestProducts.map((p) => {
      const qty = cartQtyById.get(p.id) ?? 0;
      if (!qty) return p;

      const raw = (p as any).stock;
      const stockNum = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : 999;
      const stock = Number.isFinite(stockNum) ? Math.max(0, Math.floor(stockNum)) : 999;

      return { ...p, stock: Math.max(0, stock - qty) } as any;
    });

    safeWriteProducts(nextProducts);

    alert(`Order placed successfully.\nOrder ID: ${orderId}`);
    clearCart();
  }

  const couponShow =
    appliedCoupon?.type === "FIXED" ? `৳ ${appliedCoupon.value}` : `${appliedCoupon?.value ?? 0}%`;

  return (
    <div className="w-full bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
        <h1 className="text-3xl font-bold text-pink-500 mb-6">Checkout</h1>

        {items.length === 0 ? (
          <div className="bg-zinc-900 p-6 rounded">
            <p className="text-gray-300">Your cart is empty.</p>
            <Link href="/products" className="inline-block mt-4 text-pink-400 hover:text-pink-300">
              Go to Products →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* LEFT */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Details */}
              <div className="bg-zinc-900 p-6 rounded">
                <h2 className="text-xl font-bold mb-4">Delivery Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Full Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Phone</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-300 mb-1">Address</label>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">City</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Shipping Zone</label>
                    <select
                      value={shippingZone}
                      onChange={(e) => setShippingZone(e.target.value as ShippingZone)}
                      className="w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none"
                    >
                      <option value="INSIDE_DHAKA">Inside Dhaka (৳ 50)</option>
                      <option value="OUTSIDE_DHAKA">Outside Dhaka (৳ 100)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-300 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none"
                    >
                      <option>{PM_SSL}</option>
                      <option>{PM_COD}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Coupon */}
              <div className="bg-zinc-900 p-6 rounded">
                <h2 className="text-xl font-bold mb-3">Coupon</h2>

                {/* ✅ Quick Apply: My Spin Coupon */}
                {isLoggedIn && myCoupon && !appliedCoupon ? (
                  <div className="mb-4 border border-zinc-800 bg-zinc-950/40 rounded p-4">
                    <p className="text-sm text-gray-300">Your Spin coupon:</p>
                    <p className="mt-1 font-semibold text-pink-400">{myCoupon.code}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Discount: {myCoupon.kind === "FIXED" ? `৳ ${myCoupon.value}` : `${myCoupon.value}%`} • Expires:{" "}
                      {new Date(myCoupon.expiresAt).toLocaleDateString()}
                    </p>

                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setCouponInput(myCoupon.code);
                          handleApplyCoupon(myCoupon.code);
                        }}
                        className="px-4 py-2 rounded bg-pink-600 text-white hover:opacity-90"
                      >
                        Apply My Coupon
                      </button>

                      <Link
                        href="/account/coupons"
                        className="px-4 py-2 rounded border border-zinc-700 hover:border-pink-500"
                      >
                        View My Coupons →
                      </Link>
                    </div>
                  </div>
                ) : null}

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-zinc-800 p-4 rounded">
                    <div>
                      <p className="font-semibold text-pink-400">{appliedCoupon.code}</p>
                      <p className="text-sm text-gray-300">Discount: {couponShow}</p>
                    </div>
                    <button
                      onClick={() => {
                        removeCoupon();
                        setCouponMsg("Coupon removed.");
                      }}
                      className="px-4 py-2 rounded bg-zinc-900 hover:bg-black border border-zinc-700"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Enter your Spin coupon code"
                    />
                    <button
                      onClick={() => handleApplyCoupon()}
                      className="px-5 py-2 rounded bg-pink-500 hover:bg-pink-600"
                      type="button"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {couponMsg ? <p className="mt-3 text-sm text-gray-300">{couponMsg}</p> : null}
              </div>

              {/* Items */}
              <div className="bg-zinc-900 p-6 rounded">
                <h2 className="text-xl font-bold mb-4">Items</h2>
                <div className="space-y-3">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-gray-300">
                      <span>
                        {it.name} × {it.qty}
                      </span>
                      <span>৳ {it.price * it.qty}</span>
                    </div>
                  ))}
                </div>

                <Link href="/cart" className="inline-block mt-4 text-pink-400 hover:text-pink-300">
                  ← Back to Cart
                </Link>
              </div>
            </div>

            {/* RIGHT */}
            <div className="bg-zinc-900 p-6 rounded lg:sticky lg:top-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>৳ {subtotal}</span>
              </div>

              <div className="flex justify-between text-gray-300 mt-2">
                <span>Discount</span>
                <span>- ৳ {discountAmount}</span>
              </div>

              <div className="flex justify-between text-gray-300 mt-2">
                <span>Shipping</span>
                <span>৳ {shippingFee}</span>
              </div>

              <hr className="my-4 border-zinc-800" />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-pink-400">৳ {grandTotal}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="mt-5 w-full bg-pink-500 hover:bg-pink-600 py-3 rounded"
                type="button"
              >
                Place Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
