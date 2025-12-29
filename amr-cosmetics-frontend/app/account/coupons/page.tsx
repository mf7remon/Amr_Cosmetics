"use client";

import { useCoupons } from "@/app/context/CouponContext";
import { useMemo, useState } from "react";

export default function MyCouponsPage() {
  const { coupons, clearCoupons } = useCoupons();

  const [now] = useState(() => Date.now()); // ✅ not during render

  const activeCoupons = useMemo(() => {
    return coupons
      .filter((c) => !c.used && c.expiresAt > now)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [coupons, now]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-pink-500">My Coupons</h1>

        {coupons.length > 0 && (
          <button
            onClick={clearCoupons}
            className="text-sm border border-zinc-700 px-3 py-2 rounded hover:border-pink-500"
          >
            Clear Coupons
          </button>
        )}
      </div>

      {activeCoupons.length === 0 ? (
        <p className="text-gray-400">No active coupons yet.</p>
      ) : (
        <div className="space-y-4">
          {activeCoupons.map((c) => (
            <div key={c.id} className="border border-zinc-800 rounded p-4 bg-zinc-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{c.title}</h3>
                  <p className="text-sm text-gray-400">Code: {c.code}</p>
                  <p className="text-sm text-gray-400">Discount: {c.discount}%</p>
                  <p className="text-sm text-gray-400">
                    Expires: {new Date(c.expiresAt).toLocaleDateString()}
                  </p>
                </div>

                <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-gray-300">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
