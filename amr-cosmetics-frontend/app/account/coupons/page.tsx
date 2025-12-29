"use client";

import { useCoupons } from "@/app/context/CouponContext";
import { useEffect, useState } from "react";

export default function MyCouponsPage() {
  const { coupons } = useCoupons();
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const activeCoupons = coupons.filter(
    (c) => !c.used && c.expiresAt > now
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-pink-500 mb-6">
        My Coupons
      </h1>

      {activeCoupons.length === 0 && (
        <p className="text-gray-400">No active coupons yet.</p>
      )}

      <div className="space-y-4">
        {activeCoupons.map((c) => (
          <div
            key={c.id}
            className="border border-zinc-800 rounded p-4 bg-zinc-900"
          >
            <h3 className="font-semibold">{c.title}</h3>
            <p className="text-sm text-gray-400">Code: {c.code}</p>
            <p className="text-sm text-gray-400">
              Expires: {new Date(c.expiresAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
