// app/account/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCoupons } from "@/app/context/CouponContext";
import {
  ADMIN_COUPONS_UPDATED_EVENT,
  safeReadActiveAdminCoupons,
  type AdminCoupon,
} from "@/app/lib/couponsStore";

type WheelSegment =
  | { key: string; kind: "COUPON"; coupon: AdminCoupon; label: string }
  | { key: string; kind: "LOSE"; label: string };

type SpinRecord = {
  spun: boolean;
  kind: "COUPON" | "LOSE";
  label: string;
  code?: string;
  title?: string;
  at: number;
};

const SPIN_PREFIX = "amr_spin_once_v1";

function makeSpinKey(email?: string | null) {
  const clean = (email ?? "").trim().toLowerCase();
  return clean ? `${SPIN_PREFIX}:${clean}` : `${SPIN_PREFIX}:guest`;
}

function safeReadSpinRecord(key: string): SpinRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Partial<SpinRecord> | null;
    if (!obj || typeof obj !== "object") return null;
    if (obj.spun !== true) return null;

    const kind = obj.kind === "COUPON" || obj.kind === "LOSE" ? obj.kind : null;
    const label = typeof obj.label === "string" ? obj.label : "";
    const at = typeof obj.at === "number" ? obj.at : Number(obj.at);

    if (!kind || !label || !Number.isFinite(at)) return null;

    const code = typeof obj.code === "string" ? obj.code : undefined;
    const title = typeof obj.title === "string" ? obj.title : undefined;

    return { spun: true, kind, label, code, title, at };
  } catch {
    return null;
  }
}

function safeWriteSpinRecord(key: string, rec: SpinRecord) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(rec));
  } catch {
    // ignore
  }
}

function formatSegmentLabel(c: AdminCoupon): string {
  const v = Number(c.value);
  const safeV = Number.isFinite(v) ? Math.max(1, Math.floor(v)) : 1;
  return c.type === "FIXED" ? `৳${safeV}\nOFF` : `${safeV}%\nOFF`;
}

function pickNiceColors(n: number) {
  const base = [
    "#f97316",
    "#f59e0b",
    "#facc15",
    "#22c55e",
    "#14b8a6",
    "#06b6d4",
    "#60a5fa",
    "#a855f7",
    "#f43f5e",
    "#fb7185",
    "#34d399",
  ];
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(base[i % base.length]);
  return out;
}

function norm360(deg: number) {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

// ✅ winner segment = pointer এর ঠিক নিচে যেটা আছে
function getWinnerIndex(rotationDeg: number, sliceDeg: number, count: number): number {
  if (!count || !sliceDeg) return 0;
  const r = norm360(rotationDeg);
  const angleAtPointer = norm360(360 - r); // wheel ঘুরলে top-এ কোন original angle আসে
  return Math.min(count - 1, Math.floor(angleAtPointer / sliceDeg));
}

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const { addCoupon } = useCoupons();

  // ====== Admin coupons -> wheel segments (dynamic) ======
  const [adminCoupons, setAdminCoupons] = useState<AdminCoupon[]>([]);
  useEffect(() => {
    const load = () => setAdminCoupons(safeReadActiveAdminCoupons(Date.now()));

    load();

    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "amr_admin_coupons") load();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(ADMIN_COUPONS_UPDATED_EVENT, onCustom as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(ADMIN_COUPONS_UPDATED_EVENT, onCustom as any);
    };
  }, []);

  const segments: WheelSegment[] = useMemo(() => {
    const list: WheelSegment[] = adminCoupons.map((c) => ({
      key: `COUPON:${c.id}`,
      kind: "COUPON",
      coupon: c,
      label: formatSegmentLabel(c),
    }));

    const lose: WheelSegment = { key: "LOSE:1", kind: "LOSE", label: "Better\nluck" };

    if (list.length <= 1) return [lose, ...list];
    const insertAt = Math.min(2, list.length);
    return [...list.slice(0, insertAt), lose, ...list.slice(insertAt)];
  }, [adminCoupons]);

  // ====== One-time spin logic (per user) ======
  const spinKey = useMemo(() => makeSpinKey(user?.email ?? null), [user?.email]);

  const [alreadySpun, setAlreadySpun] = useState(false);
  const [resultText, setResultText] = useState<string>("Press Spin Now to try your luck.");
  const [spinning, setSpinning] = useState(false);

  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const rec = safeReadSpinRecord(spinKey);
    if (!rec) {
      setAlreadySpun(false);
      setResultText("Press Spin Now to try your luck.");
      return;
    }

    setAlreadySpun(true);

    if (rec.kind === "COUPON") {
      const pretty = rec.label.replace(/\n/g, " ");
      setResultText(`You won: ${pretty}${rec.code ? ` (${rec.code})` : ""} 🎉`);
    } else {
      setResultText("Better luck next time 🙂");
    }
  }, [spinKey]);

  const sliceDeg = useMemo(() => (segments.length ? 360 / segments.length : 0), [segments.length]);

  // ✅ on-load: wheel যেন pointer-এর সাথে segment-center এ থাকে (professional feel)
  useEffect(() => {
    if (!segments.length || !sliceDeg) return;
    // only once (initial)
    setRotation((r) => (r === 0 ? 360 - sliceDeg / 2 : r));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.length, sliceDeg]);

  const wheelSize = 420;
  const ringPad = 10;
  const labelRadius = wheelSize / 2 - 92;

  // ✅ crisp segments (no color bleed) + correct alignment (0deg at top)
  const wheelBg = useMemo(() => {
    if (!segments.length) return "conic-gradient(#27272a 0deg, #27272a 360deg)";

    const colors = pickNiceColors(segments.length);

    // duplicate stops -> hard edges
    const eps = 0.02; // tiny overlap to hide AA seams
    const parts = segments.map((_, i) => {
      const start = i * sliceDeg;
      const end = (i + 1) * sliceDeg;
      const a = start + eps;
      const b = end - eps;
      const c = colors[i];
      return `${c} ${a}deg, ${c} ${b}deg`;
    });

    // NOTE: default conic-gradient starts at top, clockwise (perfect for pointer)
    return `conic-gradient(${parts.join(", ")})`;
  }, [segments, sliceDeg]);

  const spin = () => {
    if (spinning) return;

    if (!segments.length) {
      alert("No active coupons available right now.");
      return;
    }

    const loseIndex = segments.findIndex((s) => s.kind === "LOSE");
    const targetIndex = alreadySpun ? (loseIndex >= 0 ? loseIndex : 0) : Math.floor(Math.random() * segments.length);

    // choose a point inside the target slice (not border)
    const innerOffset = (Math.random() * sliceDeg * 0.6) - sliceDeg * 0.3;
    const targetMid = targetIndex * sliceDeg + sliceDeg / 2 + innerOffset;

    // make final rotation mod 360 so that targetMid lands at pointer (0deg)
    const desiredRotationMod = norm360(360 - targetMid);
    const currentMod = norm360(rotation);
    const deltaToDesired = norm360(desiredRotationMod - currentMod);

    const extraSpins = 6;
    const nextRotation = rotation + extraSpins * 360 + deltaToDesired;

    setSpinning(true);
    setRotation(nextRotation);

    window.setTimeout(() => {
      // ✅ decide winner from FINAL rotation (arrow/pointer matches 100%)
      const winnerIndex = getWinnerIndex(nextRotation, sliceDeg, segments.length);
      const seg = segments[winnerIndex];

      if (alreadySpun) {
        setResultText("Better luck next time 🙂");
        setSpinning(false);
        return;
      }

      if (seg.kind === "COUPON") {
        const pretty = seg.label.replace(/\n/g, " ");
        setResultText(`You won: ${pretty} (${seg.coupon.code}) 🎉`);

        addCoupon({
          id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
          title: seg.coupon.title,
          code: seg.coupon.code,
          kind: seg.coupon.type,
          value: Math.max(1, Math.floor(Number(seg.coupon.value))),
          expiresAt: Number(seg.coupon.expiresAt),
          used: false,
          createdAt: Date.now(),
        });

        safeWriteSpinRecord(spinKey, {
          spun: true,
          kind: "COUPON",
          label: seg.label,
          code: seg.coupon.code,
          title: seg.coupon.title,
          at: Date.now(),
        });
      } else {
        setResultText("Better luck next time 🙂");

        safeWriteSpinRecord(spinKey, {
          spun: true,
          kind: "LOSE",
          label: "Better luck next time",
          at: Date.now(),
        });
      }

      setAlreadySpun(true);
      setSpinning(false);
    }, 3200);
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
      <div className="max-w-6xl mx-auto px-4 py-12 text-white">
        <h1 className="text-4xl font-bold text-pink-500 mb-8 text-center">My Account</h1>

        <div className="bg-zinc-900/70 border border-zinc-800 p-7 rounded-xl shadow-sm max-w-5xl mx-auto">
          <div className="space-y-3">
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
        </div>

        <div className="mt-8 flex gap-4 flex-wrap justify-center">
          <Link href="/products" className="px-6 py-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">
            Continue Shopping
          </Link>

          <Link href="/cart" className="px-6 py-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">
            View Cart
          </Link>

          <Link
            href="/account/orders"
            className="px-6 py-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800"
          >
            My Orders
          </Link>

          <Link
            href="/account/coupons"
            className="px-6 py-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800"
          >
            My Coupons
          </Link>

          <button
            className="px-6 py-3 rounded-lg bg-pink-500 hover:bg-pink-600"
            onClick={() => {
              logout();
              router.push("/");
            }}
            type="button"
          >
            Logout
          </button>
        </div>

        {/* ===== Spin to Win panel ===== */}
        <div className="mt-12 max-w-6xl mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/70 to-zinc-950/70 shadow-lg overflow-hidden">
            <div className="px-8 py-7 flex items-start justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  Spin to Win <span aria-hidden="true">🎡</span>
                </h2>
                <p className="text-gray-300 mt-2">
                  <span className="text-gray-500">|</span>{" "}
                  {alreadySpun ? "You already spun once." : "You can spin once."}
                </p>
              </div>

              <button
                type="button"
                onClick={spin}
                disabled={spinning || segments.length === 0}
                className={
                  spinning || segments.length === 0
                    ? "px-7 py-3 rounded-lg bg-pink-500/50 text-white cursor-not-allowed"
                    : "px-7 py-3 rounded-lg bg-pink-500 text-white hover:bg-pink-600"
                }
              >
                {spinning ? "Spinning..." : "Spin Now"}
              </button>
            </div>

            <div className="px-8 pb-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* WHEEL */}
                <div className="flex justify-center">
                  <div className="relative" style={{ width: wheelSize, height: wheelSize }}>
                    {/* pointer */}
                    <div className="absolute left-1/2 -top-3 z-30" style={{ transform: "translateX(-50%)" }}>
                      <div
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: "12px solid transparent",
                          borderRight: "12px solid transparent",
                          borderBottom: "22px solid #ff2d96",
                          filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.35))",
                        }}
                      />
                    </div>

                    {/* outer ring */}
                    <div className="absolute inset-0 rounded-full bg-zinc-800/60" />
                    <div className="absolute inset-[8px] rounded-full bg-zinc-950" />

                    {/* spinning wheel */}
                    <div
                      className="absolute"
                      style={{
                        inset: ringPad,
                        borderRadius: 9999,
                        background: wheelBg,
                        transform: `rotate(${rotation}deg)`,
                        transition: "transform 3200ms cubic-bezier(0.22, 1, 0.36, 1)",
                        boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
                        overflow: "hidden",
                        // ✅ keep colors strictly inside circle + hide any AA edges
                        outline: "10px solid rgba(0,0,0,0.25)",
                        outlineOffset: "-10px",
                      }}
                    >
                      {/* slice dividers (thicker so no bleed between segments) */}
                      {segments.map((_, i) => (
                        <div
                          key={`line-${i}`}
                          className="absolute left-1/2 top-1/2"
                          style={{
                            width: 5,
                            height: "57%",
                            background: "rgba(0,0,0,0.35)",
                            transformOrigin: "bottom center",
                            transform: `translate(-50%, -100%) rotate(${i * sliceDeg}deg)`,
                            borderRadius: 9999,
                          }}
                        />
                      ))}

                      {/* labels */}
                      {segments.map((s, i) => {
                        const mid = i * sliceDeg + sliceDeg / 2;
                        const flip = mid > 90 && mid < 270;
                        const textRotate = flip ? 270 : 90;
                        const fontClass = s.label.length > 10 ? "text-[18px]" : "text-[22px]";

                        return (
                          <div
                            key={`lbl-${s.key}`}
                            className="absolute left-1/2 top-1/2 z-10"
                            style={{
                              transform: `translate(-50%, -50%) rotate(${mid}deg) translateY(-${labelRadius}px) rotate(${textRotate}deg)`,
                              transformOrigin: "center",
                            }}
                          >
                            <div
                              className={[
                                "text-white font-extrabold tracking-wide select-none",
                                "drop-shadow-[0_2px_2px_rgba(0,0,0,0.65)]",
                                "whitespace-pre-line leading-tight text-center",
                                fontClass,
                              ].join(" ")}
                              style={{ width: 120 }}
                            >
                              {s.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* center button */}
                    <button
                      type="button"
                      onClick={spin}
                      disabled={spinning || segments.length === 0}
                      className={[
                        "absolute left-1/2 top-1/2 z-40",
                        "h-28 w-28 rounded-full",
                        "flex items-center justify-center",
                        "font-extrabold text-3xl tracking-wider",
                        "border-[6px] border-white/30",
                        "bg-indigo-500/80 hover:bg-indigo-500",
                        "shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
                        spinning || segments.length === 0 ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                      style={{ transform: "translate(-50%, -50%)" }}
                    >
                      SPIN
                    </button>
                  </div>
                </div>

                {/* RESULT */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-7">
                  <h3 className="text-2xl font-bold mb-4">Result</h3>

                  <div className="bg-black/40 border border-zinc-800 rounded-xl p-5">
                    <p className="text-xl font-semibold">{resultText}</p>
                  </div>

                  <p className="text-gray-300 mt-5">
                    Winning coupon is in{" "}
                    <Link href="/account/coupons" className="text-pink-400 font-semibold hover:text-pink-300">
                      My Coupons
                    </Link>{" "}
                  </p>

                  {segments.length === 0 ? <p className="text-sm text-gray-400 mt-3">No active admin coupons right now.</p> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ===== /Spin to Win panel ===== */}
      </div>
    </div>
  );
}
