"use client";

import { useCoupons } from "@/app/context/CouponContext";
import { useMemo, useState } from "react";
import Link from "next/link";

type Prize = { title: string; discount: number };

export default function SpinPage() {
  const { addCoupon } = useCoupons();

  const prizes: Prize[] = useMemo(
    () => [
      { title: "5% OFF", discount: 5 },
      { title: "10% OFF", discount: 10 },
      { title: "15% OFF", discount: 15 },
      { title: "20% OFF", discount: 20 },
    ],
    []
  );

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const [code, setCode] = useState<string>("");

  function makeCode(discount: number) {
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `AMR${discount}-${rand}`;
  }

  function handleSpin() {
    if (spinning) return;

    setSpinning(true);
    setResult(null);
    setCode("");

    // fake spin delay
    setTimeout(() => {
      const picked = prizes[Math.floor(Math.random() * prizes.length)];
      const couponCode = makeCode(picked.discount);

      const now = Date.now();
      addCoupon({
        id: `cp_${now}_${Math.random().toString(16).slice(2)}`,
        title: picked.title,
        code: couponCode,
        discount: picked.discount,
        createdAt: now,
        expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
        used: false,
      });

      setResult(picked);
      setCode(couponCode);
      setSpinning(false);
    }, 1200);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-pink-500 mb-2">Spin to Win 🎡</h1>
      <p className="text-gray-400 mb-8">
        Spin and get a random discount coupon. Saved automatically in “My Coupons”.
      </p>

      <div className="border border-zinc-800 bg-zinc-900 rounded p-6">
        <div className="flex items-center justify-center mb-6">
          <div
            className={`w-44 h-44 rounded-full border-4 border-pink-500 flex items-center justify-center ${
              spinning ? "animate-spin" : ""
            }`}
          >
            <span className="text-sm text-gray-300">SPIN</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="bg-pink-500 hover:bg-pink-600 disabled:opacity-60 px-6 py-3 rounded font-semibold"
          >
            {spinning ? "Spinning..." : "Spin Now"}
          </button>

          <Link
            href="/account/coupons"
            className="border border-zinc-700 hover:border-pink-500 px-6 py-3 rounded font-semibold"
          >
            My Coupons
          </Link>
        </div>

        {result && (
          <div className="mt-6 border border-zinc-800 bg-black/30 rounded p-4">
            <p className="text-lg font-semibold">
              You won: <span className="text-pink-400">{result.title}</span>
            </p>
            <p className="text-gray-400 text-sm mt-1">Your coupon code:</p>
            <div className="mt-2 font-mono text-pink-300">{code}</div>
          </div>
        )}
      </div>
    </div>
  );
}
