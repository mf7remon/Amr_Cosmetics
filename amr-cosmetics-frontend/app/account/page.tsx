"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCoupons } from "@/app/context/CouponContext";
import {
  ADMIN_COUPONS_KEY,
  ADMIN_COUPONS_UPDATED_EVENT,
  safeReadActiveAdminCoupons,
  type AdminCoupon,
} from "@/app/lib/couponsStore";

type WheelSegment =
  | { kind: "COUPON"; coupon: AdminCoupon; label: string }
  | { kind: "LOSE"; label: string };

const SPIN_ONCE_PREFIX = "amr_spin_once_v1";

function makeSpinOnceKey(email?: string | null) {
  const clean = (email ?? "").trim().toLowerCase();
  return clean ? `${SPIN_ONCE_PREFIX}:${clean}` : `${SPIN_ONCE_PREFIX}:guest`;
}

function safeReadHasSpun(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function safeWriteHasSpun(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // ignore
  }
}

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const { addCoupon } = useCoupons();

  // ----- Admin active coupons (for wheel) -----
  const [activeAdminCoupons, setActiveAdminCoupons] = useState<AdminCoupon[]>([]);
  useEffect(() => {
    const load = () => {
      try {
        setActiveAdminCoupons(safeReadActiveAdminCoupons());
      } catch {
        setActiveAdminCoupons([]);
      }
    };

    load();

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === ADMIN_COUPONS_KEY) load();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(ADMIN_COUPONS_UPDATED_EVENT, load as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(ADMIN_COUPONS_UPDATED_EVENT, load as any);
    };
  }, []);

  // ----- Spin once per user -----
  const spinOnceKey = useMemo(() => makeSpinOnceKey(user?.email ?? null), [user?.email]);
  const [hasSpun, setHasSpun] = useState(false);

  useEffect(() => {
    setHasSpun(safeReadHasSpun(spinOnceKey));
  }, [spinOnceKey]);

  // ----- Wheel UI state -----
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinMsg, setSpinMsg] = useState<string | null>(null);

  const segments: WheelSegment[] = useMemo(() => {
    const coupons = activeAdminCoupons.map((c) => ({
      kind: "COUPON" as const,
      coupon: c,
      label: `${c.code}`,
    }));
    // ✅ Keep a "lose" segment (first spin can land here)
    return [...coupons, { kind: "LOSE" as const, label: "Better luck next time" }];
  }, [activeAdminCoupons]);

  const wheelBg = useMemo(() => {
    const n = Math.max(1, segments.length);
    const colors = [
      "rgba(236,72,153,0.55)",
      "rgba(24,24,27,0.95)",
      "rgba(244,63,94,0.45)",
      "rgba(39,39,42,0.95)",
      "rgba(168,85,247,0.45)",
      "rgba(24,24,27,0.95)",
      "rgba(251,191,36,0.35)",
      "rgba(39,39,42,0.95)",
    ];

    const stops: string[] = [];
    for (let i = 0; i < n; i++) {
      const start = (i * 360) / n;
      const end = ((i + 1) * 360) / n;
      const col = colors[i % colors.length];
      stops.push(`${col} ${start}deg ${end}deg`);
    }

    return `conic-gradient(${stops.join(", ")})`;
  }, [segments.length]);

  const spin = () => {
    if (isSpinning) return;
    setSpinMsg(null);

    if (segments.length <= 0) {
      alert("No active coupons available right now.");
      return;
    }

    setIsSpinning(true);

    // 🔁 Always animate (even if already spun)
    const n = Math.max(1, segments.length);
    const anglePer = 360 / n;

    const chosenIndex = hasSpun
      ? // already spun -> fixed result message later
        Math.floor(Math.random() * n)
      : Math.floor(Math.random() * n);

    // rotate so chosen segment center lands near top pointer
    const targetCenter = chosenIndex * anglePer + anglePer / 2;
    const extraSpins = 6 * 360;

    const nextRotation = rotation + extraSpins - targetCenter;
    setRotation(nextRotation);

    window.setTimeout(() => {
      setIsSpinning(false);

      if (hasSpun) {
        setSpinMsg("Better luck next time 🙂");
        return;
      }

      // first spin result from wheel
      const picked = segments[chosenIndex];

      // mark spun (regardless of win/lose)
      safeWriteHasSpun(spinOnceKey);
      setHasSpun(true);

      if (picked.kind === "LOSE") {
        setSpinMsg("Better luck next time 🙂");
        // NOTE: you earlier said: first time 'Better luck' হলে save করতে হবে (later we can handle separately)
        return;
      }

      const c = picked.coupon;

      addCoupon({
        id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        title: c.title,
        code: String(c.code ?? "").trim().toUpperCase(),
        kind: c.type === "FIXED" ? "FIXED" : "PERCENT",
        value: Math.max(1, Math.floor(Number(c.value))),
        expiresAt: Number(c.expiresAt),
        used: false,
        createdAt: Date.now(),
      });

      setSpinMsg(`You won: ${c.title} ✅ (Code: ${c.code})`);
      alert(`You won: ${c.title}\nCode: ${c.code}`);
    }, 2200);
  };

  if (!isLoggedIn) {
    return (
      <div className="w-full bg-black">
        <div className="max-w-3xl mx-auto px-4 py-12 text-white">
          <h1 className="text-3xl font-bold text-pink-500 mb-3">Account</h1>
          <p className="text-gray-300">You are not logged in.</p>
          <Link href="/login" className="inline-block mt-4 text-pink-400 hover:text-pink-300">
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black">
      <div className="max-w-4xl mx-auto px-4 py-12 text-white">
        <h1 className="text-3xl font-bold text-pink-500 mb-6">My Account</h1>

        {/* Profile */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded space-y-2">
          <p className="text-gray-300">
            Name: <span className="text-white font-semibold">{user?.name}</span>
          </p>
          <p className="text-gray-300">
            Email: <span className="text-white font-semibold">{user?.email}</span>
          </p>
          <p className="text-gray-300">
            Role: <span className="text-white font-semibold">{user?.role}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3 flex-wrap">
          <Link href="/products" className="px-4 py-2 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">
            Continue Shopping
          </Link>

          <Link href="/cart" className="px-4 py-2 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">
            View Cart
          </Link>

          <Link href="/account/orders" className="px-4 py-2 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">
            My Orders
          </Link>

          <Link href="/account/coupons" className="px-4 py-2 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">
            My Coupons
          </Link>

          <button
            className="px-4 py-2 rounded bg-pink-500 hover:bg-pink-600"
            onClick={() => {
              logout();
              router.push("/");
            }}
            type="button"
          >
            Logout
          </button>
        </div>

        {/* ✅ Spin to Win (Wheel inside Account page) */}
        <div className="mt-10 border border-zinc-800 bg-zinc-900 rounded p-6">
          <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
            <div>
              <h2 className="text-2xl font-bold text-white">Spin to Win 🎡</h2>
              <p className="text-sm text-gray-400 mt-1">
                Admin active coupons থেকে wheel তৈরি হয়। {hasSpun ? "You already spun once." : "You can spin once."}
              </p>
            </div>

            <button
              type="button"
              onClick={spin}
              disabled={isSpinning || segments.length === 0}
              className={
                isSpinning || segments.length === 0
                  ? "px-5 py-2 rounded bg-zinc-800 text-gray-300 cursor-not-allowed border border-zinc-700"
                  : "px-5 py-2 rounded bg-pink-600 text-white hover:opacity-90"
              }
            >
              {isSpinning ? "Spinning..." : "Spin Now"}
            </button>
          </div>

          <div className="mt-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Wheel */}
            <div className="relative">
              {/* pointer */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-20">
                <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-l-transparent border-r-transparent border-b-pink-500" />
              </div>

              <div
                className="h-64 w-64 rounded-full border border-zinc-700 bg-zinc-950 shadow-inner overflow-hidden"
                style={{
                  backgroundImage: wheelBg,
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? "transform 2.1s cubic-bezier(.2,.8,.2,1)" : "none",
                }}
                aria-label="Spin wheel"
              />

              <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-12 w-12 rounded-full bg-black border border-zinc-700" />
              </div>
            </div>

            {/* Wheel info */}
            <div className="flex-1 w-full">
              {spinMsg ? (
                <div className="border border-zinc-800 bg-zinc-950/40 rounded-lg p-4 text-gray-200">
                  {spinMsg}
                </div>
              ) : (
                <div className="border border-zinc-800 bg-zinc-950/40 rounded-lg p-4 text-gray-300">
                  {segments.length === 0 ? "No active coupons right now." : "Press Spin Now to try your luck."}
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Current wheel segments:</p>
                <div className="flex flex-wrap gap-2">
                  {segments.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-full border border-zinc-700 bg-zinc-950 text-gray-200"
                    >
                      {s.label}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  Won coupon গুলো <span className="text-gray-300">My Coupons</span> এ থাকবে।
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* end Spin */}
      </div>
    </div>
  );
}
