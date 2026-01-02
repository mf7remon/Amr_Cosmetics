"use client";

import { useMemo } from "react";
import { useCoupons } from "@/app/context/CouponContext";
import { safeReadAdminCoupons } from "@/app/lib/couponsStore";

export default function SpinPage() {
  const { addCoupon } = useCoupons();

  const activeAdminCoupons = useMemo(() => {
    const all = safeReadAdminCoupons();
    const now = Date.now();
    return all.filter((c) => c.active && c.expiresAt > now);
  }, []);

  const spin = () => {
    if (activeAdminCoupons.length === 0) {
      alert("No active coupons available right now.");
      return;
    }

    const win = activeAdminCoupons[Math.floor(Math.random() * activeAdminCoupons.length)];

    addCoupon({
      id: crypto.randomUUID(),
      title: win.title,
      code: win.code,
      discount: win.type === "PERCENT" ? win.value : win.value,
      expiresAt: win.expiresAt,
      used: false,
      createdAt: Date.now(),
    });

    alert(`You won: ${win.title} (Code: ${win.code})`);
  };

  return (
    <div className="max-w-md mx-auto py-20 text-center">
      <h1 className="text-3xl font-bold text-pink-500 mb-6">Spin & Win 🎡</h1>

      <p className="text-gray-300 mb-6">
        Only admin active coupons can be won.
      </p>

      <button
        type="button"
        onClick={spin}
        className="bg-pink-600 px-6 py-3 rounded text-white hover:opacity-90"
      >
        Spin Now
      </button>

      <div className="mt-8 text-left border border-zinc-800 bg-zinc-900 rounded p-4">
        <p className="text-sm text-gray-300 mb-2">Active coupons available:</p>
        {activeAdminCoupons.length === 0 ? (
          <p className="text-sm text-gray-400">None</p>
        ) : (
          <ul className="text-sm text-gray-200 space-y-1">
            {activeAdminCoupons.map((c) => (
              <li key={c.id}>
                {c.title} <span className="text-gray-400">({c.code})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
