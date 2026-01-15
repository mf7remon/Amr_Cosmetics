"use client";

import { useCoupons } from "@/app/context/CouponContext";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useMemo, useState } from "react";

type LoseEntry = { createdAt: number };

const SPIN_LOSE_PREFIX = "amr_spin_lose_v1";

function makeLoseKey(email?: string | null) {
  const clean = (email ?? "").trim().toLowerCase();
  return clean ? `${SPIN_LOSE_PREFIX}:${clean}` : `${SPIN_LOSE_PREFIX}:guest`;
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readLose(email?: string | null): LoseEntry | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(makeLoseKey(email));
  const obj = safeJsonParse<unknown>(raw, null);
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const createdAt = typeof o.createdAt === "number" ? o.createdAt : Number(o.createdAt);
  if (!Number.isFinite(createdAt)) return null;
  return { createdAt };
}

export default function MyCouponsPage() {
  const { coupons } = useCoupons();
  const { user } = useAuth();

  const [now, setNow] = useState<number>(0);
  const [loseEntry, setLoseEntry] = useState<LoseEntry | null>(null);

  useEffect(() => {
    setNow(Date.now());
    setLoseEntry(readLose(user?.email ?? null));
  }, [user?.email]);

  const activeCoupons = useMemo(() => {
    return coupons
      .filter((c) => !c.used && c.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [coupons, now]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-pink-500 mb-6">My Coupons</h1>

      {loseEntry ? (
        <div className="border border-zinc-800 rounded p-4 bg-zinc-900 mb-6">
          <h3 className="font-semibold text-white">Better luck next time 😅</h3>
          <p className="text-sm text-gray-400 mt-1">
            You used your one-time spin. (Saved on: {new Date(loseEntry.createdAt).toLocaleString()})
          </p>
        </div>
      ) : null}

      {activeCoupons.length === 0 && !loseEntry ? <p className="text-gray-400">No active coupons yet.</p> : null}

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

                <p className="text-xs text-gray-500 mt-3">
                  ✅ Checkout এ শুধু এই won coupon টাই কাজ করবে।
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

      <div className="mt-8 border border-zinc-800 bg-zinc-900 rounded p-4">
        <p className="text-sm text-gray-300 font-semibold mb-2">Rules</p>
        <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
          <li>First spin এ real result হবে (win / better luck)।</li>
          <li>Second time+ spin করলে animation হবে, কিন্তু result fixed “Better luck next time”.</li>
          <li>Coupon valid থাকলে আপনি multiple times use করতে পারবেন।</li>
          <li>Checkout এ শুধু আপনার won coupon টাই কাজ করবে।</li>
        </ul>
      </div>
    </div>
  );
}
