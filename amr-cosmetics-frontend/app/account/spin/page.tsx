"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useCoupons } from "@/app/context/CouponContext";
import {
  safeReadActiveAdminCoupons,
  ADMIN_COUPONS_KEY,
  ADMIN_COUPONS_UPDATED_EVENT,
  type AdminCoupon,
} from "@/app/lib/couponsStore";

type WheelSegment =
  | { key: string; kind: "LOSE"; label: string }
  | { key: string; kind: "COUPON"; label: string; coupon: AdminCoupon };

const SPIN_ONCE_PREFIX = "amr_spin_once_v1";

function makeSpinKey(email?: string | null) {
  const clean = (email ?? "").trim().toLowerCase();
  return clean ? `${SPIN_ONCE_PREFIX}:${clean}` : `${SPIN_ONCE_PREFIX}:guest`;
}

function safeReadBool(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === "1" || raw === "true";
  } catch {
    return false;
  }
}

function safeWriteBool(key: string, v: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, v ? "1" : "0");
  } catch {}
}

function formatSegmentLabel(c: AdminCoupon): string {
  const v = Number(c.value);
  const safeV = Number.isFinite(v) ? Math.max(1, Math.floor(v)) : 1;
  return c.type === "FIXED" ? `৳${safeV} OFF` : `${safeV}% OFF`;
}

function pickPaletteColor(i: number) {
  const palette = [
    "#ec4899", // pink
    "#f97316", // orange
    "#facc15", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#a855f7", // purple
    "#fb7185", // rose
    "#60a5fa", // blue
  ];
  return palette[i % palette.length];
}

export default function SpinPage() {
  const { user, isLoggedIn } = useAuth();
  const { addCoupon } = useCoupons();

  const spinKey = useMemo(() => makeSpinKey(user?.email ?? null), [user?.email]);

  const [activeAdminCoupons, setActiveAdminCoupons] = useState<AdminCoupon[]>([]);
  const [spunOnce, setSpunOnce] = useState(false);

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultText, setResultText] = useState("");

  // hydrate: spin once state
  useEffect(() => {
    setSpunOnce(safeReadBool(spinKey));
  }, [spinKey]);

  // load active coupons + listeners
  useEffect(() => {
    const load = () => setActiveAdminCoupons(safeReadActiveAdminCoupons());

    load();

    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === ADMIN_COUPONS_KEY) load();
    };

    window.addEventListener(ADMIN_COUPONS_UPDATED_EVENT, onCustom as any);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(ADMIN_COUPONS_UPDATED_EVENT, onCustom as any);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const segments: WheelSegment[] = useMemo(() => {
    const list: WheelSegment[] = activeAdminCoupons.map((c) => ({
      key: c.id,
      kind: "COUPON",
      label: formatSegmentLabel(c),
      coupon: c,
    }));

    // always keep 1 lose segment
    const lose: WheelSegment = { key: "LOSE:1", kind: "LOSE", label: "Better luck" };

    return list.length ? [...list, lose] : [lose];
  }, [activeAdminCoupons]);

  const loseIndex = useMemo(() => segments.findIndex((s) => s.kind === "LOSE"), [segments]);

  const sliceDeg = useMemo(() => (segments.length ? 360 / segments.length : 360), [segments.length]);

  const wheelBg = useMemo(() => {
    if (!segments.length) return "conic-gradient(from -90deg, #18181b, #18181b)";
    const colors = segments.map((_, i) => pickPaletteColor(i));
    return `conic-gradient(from -90deg, ${colors.join(", ")})`;
  }, [segments]);

  const spin = () => {
    if (!isLoggedIn) {
      alert("Please login first to spin.");
      return;
    }
    if (spinning) return;
    if (!segments.length) return;

    // if already spun => force lose
    const targetIndex = spunOnce
      ? loseIndex >= 0
        ? loseIndex
        : 0
      : Math.floor(Math.random() * segments.length);

    // pointer is at TOP. wheel background uses "from -90deg" so 0deg = TOP.
    const centerAngle = (targetIndex + 0.5) * sliceDeg;
    const desiredNorm = (360 - (centerAngle % 360)) % 360;

    const currentNorm = ((rotation % 360) + 360) % 360;
    const delta = (desiredNorm - currentNorm + 360) % 360;

    const extraTurns = 6;
    const nextRotation = rotation + extraTurns * 360 + delta;

    setSpinning(true);
    setRotation(nextRotation);

    const durationMs = 2400;

    window.setTimeout(() => {
      const seg = segments[targetIndex];

      if (seg.kind === "LOSE") {
        setResultText("Better luck next time 🙂");

        // mark spun once (so next spins fixed lose)
        if (!spunOnce) {
          setSpunOnce(true);
          safeWriteBool(spinKey, true);
        }
      } else {
        const win = seg.coupon;
        setResultText(`You won ${seg.label} 🎉`);

        if (!spunOnce) {
          setSpunOnce(true);
          safeWriteBool(spinKey, true);

          addCoupon({
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,
            title: win.title,
            code: win.code,
            kind: win.type,
            value: win.value,
            expiresAt: win.expiresAt,
            used: false,
            createdAt: Date.now(),
          });
        }
      }

      setSpinning(false);
    }, durationMs);
  };

  // wheel sizing
  const WHEEL_SIZE = 360;
  const labelRadius = 128;

  return (
    <div className="w-full bg-black">
      <div className="max-w-6xl mx-auto px-6 py-10 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-pink-500">Spin to Win 🎡</h1>
            <p className="text-gray-300 mt-2">
              Admin active coupons থেকে wheel তৈরি হয়{spunOnce ? " | You already spun once." : "."}
            </p>
          </div>

          <button
            type="button"
            onClick={spin}
            disabled={spinning}
            className={
              spinning
                ? "px-6 py-3 rounded bg-zinc-800 text-white border border-zinc-700 cursor-not-allowed"
                : "px-6 py-3 rounded bg-pink-600 text-white hover:opacity-90"
            }
          >
            {spinning ? "Spinning..." : "Spin Now"}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* WHEEL */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
              {/* pointer */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px] border-l-transparent border-r-transparent border-b-pink-500" />
              </div>

              {/* wheel */}
              <div
                className="absolute inset-0 rounded-full border border-zinc-700 shadow-[0_0_0_8px_rgba(255,255,255,0.02)] overflow-hidden"
                style={{
                  background: wheelBg,
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? "transform 2400ms cubic-bezier(0.17, 0.67, 0.18, 0.99)"
                    : "none",
                }}
              >
                {/* inner ring */}
                <div className="absolute inset-[14px] rounded-full border border-white/10" />

                {/* segment dividers */}
                {segments.length > 1
                  ? Array.from({ length: segments.length }).map((_, i) => (
                      <div
                        key={`div-${i}`}
                        className="absolute left-1/2 top-1/2 w-[2px] h-1/2 origin-bottom bg-black/25"
                        style={{
                          transform: `translate(-50%, -100%) rotate(${i * sliceDeg}deg)`,
                        }}
                      />
                    ))
                  : null}

                {/* labels inside segments */}
                {segments.map((s, i) => {
                  const mid = i * sliceDeg + sliceDeg / 2;

                  return (
                    <div
                      key={`lbl-${s.key}`}
                      className="absolute left-1/2 top-1/2 z-10"
                      style={{
                        transform: `rotate(${mid}deg) translateY(-${labelRadius}px) rotate(90deg)`,
                        transformOrigin: "center",
                      }}
                    >
                      <div className="text-white font-extrabold text-[22px] tracking-wide select-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]">
                        {s.label}
                      </div>
                    </div>
                  );
                })}

                {/* center button */}
                <button
                  type="button"
                  onClick={spin}
                  disabled={spinning}
                  className={[
                    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30",
                    "w-24 h-24 rounded-full border-4 border-white/40",
                    spinning ? "bg-zinc-800 text-white" : "bg-white text-black hover:opacity-90",
                    "font-extrabold text-xl",
                  ].join(" ")}
                >
                  SPIN
                </button>
              </div>
            </div>
          </div>

          {/* RESULT */}
          <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white">Result</h2>

            <div className="mt-4 border border-zinc-800 bg-zinc-950/40 rounded-lg p-4">
              <p className="text-lg font-semibold">{resultText || "Spin করে দেখো কী জেতো!"}</p>
            </div>

            <p className="text-sm text-gray-400 mt-4">
              Winning coupon হলে সেটা <span className="text-pink-400 font-semibold">My Coupons</span> এ থাকবে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
