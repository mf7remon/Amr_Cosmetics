"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";

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

  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  const shippingFee = 0;

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

    // For now (frontend demo):
    // Later: create order in backend, then redirect to SSLCommerz payment session
    alert("Order placed (demo). Next step: SSLCommerz payment integration.");
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
            {/* LEFT: Delivery form + Coupon */}
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
                    <label className="block text-sm text-gray-300 mb-1">Payment Method</label>
                    <select className="w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none">
                      <option>SSLCommerz (bKash / Card / Nagad)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Coupon Section */}
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
                    >
                      Apply
                    </button>
                  </div>
                )}

                {couponMsg && <p className="mt-3 text-sm text-gray-300">{couponMsg}</p>}

                <p className="mt-3 text-xs text-gray-400">
                  Demo coupons: AMR5, AMR10, GLOW15, BEAUTY20
                </p>
              </div>

              {/* Items preview */}
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

            {/* RIGHT: Summary */}
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
              >
                Place Order (Demo)
              </button>

              <p className="mt-3 text-xs text-gray-400">
                Next step: backend order + SSLCommerz real payment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
