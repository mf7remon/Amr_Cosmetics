"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import * as OrdersStore from "@/app/lib/ordersStore";

type AnyOrder = Record<string, any>;

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

function readArrayFromKey(key: string): AnyOrder[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<unknown>(window.localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as AnyOrder[]) : [];
}

function getOrderId(o: AnyOrder): string {
  const id = o?.id ?? o?.orderId ?? o?.code ?? o?._id;
  if (typeof id === "string") return id;
  if (typeof id === "number") return String(id);
  return String(id ?? "");
}

function getOrderStatus(o: AnyOrder): string {
  const s = o?.status ?? o?.orderStatus ?? o?.state;
  if (typeof s === "string" && s.trim()) return s;
  return "Pending";
}

function getOrderTotal(o: AnyOrder): number {
  const t = o?.grandTotal ?? o?.total ?? o?.amount ?? o?.payable ?? 0;
  const n = typeof t === "number" ? t : Number(t);
  return Number.isFinite(n) ? n : 0;
}

function getOrderCreatedAt(o: AnyOrder): number {
  const t = o?.createdAt ?? o?.placedAt ?? o?.time ?? o?.date ?? 0;
  const n = typeof t === "number" ? t : Number(t);
  return Number.isFinite(n) ? n : 0;
}

function getOrderItems(o: AnyOrder): AnyOrder[] {
  const it = o?.items ?? o?.cartItems ?? o?.products ?? o?.lines;
  return Array.isArray(it) ? it : [];
}

function getOrderEmail(o: AnyOrder): string {
  const e =
    o?.userEmail ??
    o?.customerEmail ??
    o?.email ??
    o?.user?.email ??
    o?.customer?.email;

  return typeof e === "string" ? normalizeEmail(e) : "";
}

function dedupeById(list: AnyOrder[]): AnyOrder[] {
  const map = new Map<string, AnyOrder>();
  for (const o of list) {
    const id = getOrderId(o);
    if (!id) continue;
    if (!map.has(id)) map.set(id, o);
    else {
      const prev = map.get(id)!;
      const prevTime = getOrderCreatedAt(prev);
      const nextTime = getOrderCreatedAt(o);
      map.set(id, nextTime >= prevTime ? o : prev);
    }
  }
  return Array.from(map.values());
}

/**
 * Robust read strategy:
 * 1) If ordersStore has function like getOrdersForUser/safeReadOrders -> use it
 * 2) else read localStorage per-user keys like:
 *    amr_orders_v1:<email>
 *    amr_orders_v1:user.<email>
 *    amr_orders_v1:user_<email>
 * 3) else scan keys that include the email and start with "amr_orders"
 */
function readOrdersForUserEmail(email: string): AnyOrder[] {
  if (typeof window === "undefined") return [];
  const me = normalizeEmail(email);
  if (!me) return [];

  const anyStore = OrdersStore as any;

  // 1) best: ordersStore helper
  const fn1 = anyStore?.getOrdersForUser;
  if (typeof fn1 === "function") {
    try {
      const res = fn1(me);
      if (Array.isArray(res)) return dedupeById(res);
    } catch {}
  }

  const fn2 = anyStore?.safeReadOrders;
  if (typeof fn2 === "function") {
    try {
      const res = fn2();
      if (Array.isArray(res) && res.length) {
        const mine = res.filter((o: AnyOrder) => getOrderEmail(o) === me);
        if (mine.length) return dedupeById(mine);
      }
    } catch {}
  }

  // 2) direct per-user keys guesses
  const candidateKeys = [
    `amr_orders_v1:${me}`,
    `amr_orders_v1:user.${me}`,
    `amr_orders_v1:user_${me}`,
    `amr_orders:${me}`,
    `amr_orders:user.${me}`,
    `amr_orders:user_${me}`,
  ];

  let collected: AnyOrder[] = [];
  for (const k of candidateKeys) {
    const arr = readArrayFromKey(k);
    if (arr.length) collected = collected.concat(arr);
  }

  // 3) scan keys
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k) continue;
      const low = k.toLowerCase();
      if (!low.startsWith("amr_orders")) continue;
      if (!low.includes(me)) continue;
      const arr = readArrayFromKey(k);
      if (arr.length) collected = collected.concat(arr);
    }
  } catch {}

  // If still empty but store uses global orders key, fallback filter by email
  if (collected.length === 0) {
    try {
      // common global keys
      const globals = ["amr_orders_v1", "amr_orders", "amr_all_orders_v1", "amr_all_orders"];
      for (const k of globals) {
        const arr = readArrayFromKey(k);
        if (arr.length) collected = collected.concat(arr.filter((o) => getOrderEmail(o) === me));
      }
    } catch {}
  }

  return dedupeById(collected);
}

export default function AccountOrdersPage() {
  const { user, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState<AnyOrder[]>([]);

  const email = useMemo(() => normalizeEmail(user?.email ?? ""), [user?.email]);

  useEffect(() => {
    if (!isLoggedIn || !email) {
      setOrders([]);
      return;
    }

    const reload = () => setOrders(readOrdersForUserEmail(email));

    reload();

    const onCustom = () => reload();

    const onStorage = (e: StorageEvent) => {
      // any change in orders keys should trigger reload
      if (!e.key) return;
      const k = e.key.toLowerCase();
      if (k.startsWith("amr_orders")) reload();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("amr-orders-updated", onCustom as any);
    window.addEventListener("amr_orders_updated", onCustom as any);
    window.addEventListener("amr-orders-changed", onCustom as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("amr-orders-updated", onCustom as any);
      window.removeEventListener("amr_orders_updated", onCustom as any);
      window.removeEventListener("amr-orders-changed", onCustom as any);
    };
  }, [isLoggedIn, email]);

  const sorted = useMemo(() => {
    const copy = [...orders];
    copy.sort((a, b) => getOrderCreatedAt(b) - getOrderCreatedAt(a));
    return copy;
  }, [orders]);

  if (!isLoggedIn) {
    return (
      <div className="w-full bg-black">
        <div className="max-w-4xl mx-auto px-6 py-12 text-white">
          <h1 className="text-3xl font-bold text-pink-500 mb-3">My Orders</h1>
          <p className="text-gray-300">you didn't login</p>
          <Link href="/login" className="inline-block mt-4 text-pink-400 hover:text-pink-300">
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black">
      <div className="max-w-5xl mx-auto px-6 py-10 text-white">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-pink-500">My Orders</h1>
          <Link href="/account" className="text-pink-400 hover:text-pink-300">
            ← Back to Account
          </Link>
        </div>

        {sorted.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
            <p className="text-gray-300">There is order found</p>
            <Link href="/products" className="inline-block mt-4 text-pink-400 hover:text-pink-300">
              View Products →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((o) => {
              const id = getOrderId(o);
              const status = getOrderStatus(o);
              const total = getOrderTotal(o);
              const createdAt = getOrderCreatedAt(o);
              const items = getOrderItems(o);

              return (
                <div key={id} className="bg-zinc-900 border border-zinc-800 rounded p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-400">Order ID</p>
                      <p className="font-semibold text-white break-all">{id}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Date: {createdAt ? new Date(createdAt).toLocaleString() : "—"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Total</p>
                        <p className="font-bold text-pink-400">৳ {total}</p>
                      </div>

                      <span className="px-3 py-1 rounded-full text-sm border border-zinc-700 bg-zinc-950">
                        {status}
                      </span>
                    </div>
                  </div>

                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-300 hover:text-white">
                      ViewItems ({items.length})
                    </summary>

                    <div className="mt-3 space-y-2">
                      {items.length === 0 ? (
                        <p className="text-sm text-gray-400">Items data has not found</p>
                      ) : (
                        items.map((it, idx) => {
                          const name = it?.name || it?.title || "Item";
                          const qty = it?.qty ?? it?.quantity ?? 1;
                          const price = it?.price ?? 0;
                          return (
                            <div key={idx} className="flex items-center justify-between text-sm text-gray-300">
                              <span>
                                {name} × {qty}
                              </span>
                              <span>৳ {Number(price) * Number(qty)}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
