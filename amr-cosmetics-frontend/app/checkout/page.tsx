"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import * as OrdersStore from "@/app/lib/ordersStore";
import { safeReadProducts, safeWriteProducts } from "@/app/lib/productsStore";

type ShippingZone = "INSIDE_DHAKA" | "OUTSIDE_DHAKA";

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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  const [shippingZone, setShippingZone] = useState<ShippingZone>("INSIDE_DHAKA");
  const shippingFee = shippingZone === "INSIDE_DHAKA" ? 50 : 100;

  const [paymentMethod, setPaymentMethod] = useState("SSLCommerz (bKash / Card / Nagad)");

  const grandTotal = useMemo(() => Math.max(0, total + shippingFee), [total, shippingFee]);

  function handleApplyCoupon() {
    const res = applyCoupon(couponInput);
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
      const stockNum =
        typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : 999;
      const stock = Number.isFinite(stockNum) ? Math.max(0, Math.floor(stockNum)) : 999;

      return stock < it.qty;
    });

    if (bad) {
      const p = byId.get(bad.id);
      const name = p?.title ?? bad.name;

      const raw = (p as any)?.stock;
      const stockNum =
        typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : 0;
      const stock = Number.isFinite(stockNum) ? Math.max(0, Math.floor(stockNum)) : 0;

      alert(
        stock <= 0
          ? `Out of stock: ${name}\nPlease remove it from cart.`
          : `Not enough stock: ${name}\nAvailable: ${stock}, You selected: ${bad.qty}`
      );
      return;
    }

    const now = Date.now();
    const orderId = OrdersStore.makeOrderId();

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

      coupon: appliedCoupon
        ? { code: appliedCoupon.code, type: "PERCENT", value: appliedCoupon.value }
        : null,

      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };

    // ✅ This is the missing part (admin panel reads from this storage)
    OrdersStore.addOrderToStorage(order);

    // ✅ DECREASE STOCK after successful order
    const cartQtyById = new Map(items.map((it) => [it.id, it.qty]));

    const nextProducts = latestProducts.map((p) => {
      const qty = cartQtyById.get(p.id) ?? 0;
      if (!qty) return p;

      const raw = (p as any).stock;
      const stockNum =
        typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : 999;
      const stock = Number.isFinite(stockNum) ? Math.max(0, Math.floor(stockNum)) : 999;

      return { ...p, stock: Math.max(0, stock - qty) } as any;
    });

    safeWriteProducts(nextProducts);

    alert(`Order placed successfully.\nOrder ID: ${orderId}`);
    clearCart();
  }

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
                      <option>SSLCommerz (bKash / Card / Nagad)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Coupon */}
              <div className="bg-zinc-900 p-6 rounded">
                <h2 className="text-xl font-bold mb-3">Coupon</h2>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-zinc-800 p-4 rounded">
                    <div>
                      <p className="font-semibold text-pink-400">{appliedCoupon.code}</p>
                      <p className="text-sm text-gray-300">Discount: {appliedCoupon.value}%</p>
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
                    />
                    <button
                      onClick={handleApplyCoupon}
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

              <p className="mt-3 text-xs text-gray-400">
                Order place হলে admin panel এ Orders এ সাথে সাথে show করবে।
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
