"use client";

import { useCoupons } from "@/app/context/CouponContext";

const SPIN_OPTIONS = [
  { label: "5% OFF", discount: 5 },
  { label: "10% OFF", discount: 10 },
  { label: "15% OFF", discount: 15 },
  { label: "20% OFF", discount: 20 },
  { label: "৳100 OFF", discount: 100 },
  { label: "৳199 OFF", discount: 199 },
  { label: "Better luck next time", discount: 0 },
];

export default function SpinPage() {
  const { addCoupon } = useCoupons();

  const spin = () => {
    const result = SPIN_OPTIONS[Math.floor(Math.random() * SPIN_OPTIONS.length)];

    if (result.discount === 0) {
      alert("😅 Better luck next time!");
      return;
    }

    const isPercent = result.discount < 100;
    const code = isPercent
      ? `AMR${result.discount}`
      : `AMR${result.discount}`;

    addCoupon({
      id: crypto.randomUUID(),
      title: result.label,
      code,
      discount: result.discount,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      used: false,
      createdAt: Date.now(),
    });

    alert(`🎉 You won: ${result.label}`);
  };

  return (
    <div className="max-w-md mx-auto py-20 text-center">
      <h1 className="text-3xl font-bold text-pink-500 mb-6">
        Spin & Win 🎡
      </h1>

      <button
        type="button"
        onClick={spin}
        className="bg-pink-600 px-6 py-3 rounded text-white hover:opacity-90"
      >
        Spin Now
      </button>
    </div>
  );
}
