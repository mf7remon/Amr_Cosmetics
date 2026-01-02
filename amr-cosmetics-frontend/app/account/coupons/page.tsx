"use client";

import { useCoupons } from "@/app/context/CouponContext";
import { useEffect, useMemo, useState } from "react";

export default function MyCouponsPage() {
  const { coupons } = useCoupons();
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const activeCoupons = useMemo(() => {
    return coupons
      .filter((c) => !c.used && c.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [coupons, now]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-pink-500 mb-6">My Coupons</h1>

      {activeCoupons.length === 0 && <p className="text-gray-400">No active coupons yet.</p>}

      <div className="space-y-4">
        {activeCoupons.map((c) => (
          <div key={c.id} className="border border-zinc-800 rounded p-4 bg-zinc-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Code: <span className="text-pink-400 font-semibold">{c.code}</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Discount: {c.kind === "PERCENT" ? `${c.value}%` : `৳ ${c.value}`}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Expires: {new Date(c.expiresAt).toLocaleDateString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(c.code);
                  alert("Copied coupon code!");
                }}
                className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
              >
                Copy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
