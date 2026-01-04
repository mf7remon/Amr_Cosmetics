"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import * as OrdersStore from "@/app/lib/ordersStore";

type AnyOrder = Record<string, any>;

function fallbackReadOrders(key: string): AnyOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AnyOrder[]) : [];
  } catch {
    return [];
  }
}

function getOrdersKey(): string {
  // ordersStore.ts এ যদি ORDERS_KEY থাকে সেটা নেবে
  const k = (OrdersStore as any)?.ORDERS_KEY;
  return typeof k === "string" && k.trim() ? k : "amr_orders";
}

function safeReadOrders(): AnyOrder[] {
  // ordersStore.ts এ যদি safeReadOrders থাকে সেটা নেবে, না হলে fallback localStorage read
  const fn = (OrdersStore as any)?.safeReadOrders;
  if (typeof fn === "function") {
    try {
      const res = fn();
      return Array.isArray(res) ? res : [];
    } catch {
      // ignore
    }
  }
  return fallbackReadOrders(getOrdersKey());
}

function pickEmail(o: AnyOrder): string {
  const direct =
    o?.userEmail ||
    o?.customerEmail ||
    o?.email ||
    o?.user?.email ||
    o?.customer?.email;

  return typeof direct === "string" ? direct.toLowerCase() : "";
}

function pickId(o: AnyOrder): string {
  const id = o?.id || o?.orderId || o?.code;
  return typeof id === "string" ? id : String(id ?? "");
}

function pickStatus(o: AnyOrder): string {
  const s = o?.status || o?.orderStatus;
  return typeof s === "string" && s.trim() ? s : "Pending";
}

function pickTotal(o: AnyOrder): number {
  const t = o?.grandTotal ?? o?.total ?? o?.amount ?? o?.payable ?? 0;
  const n = typeof t === "number" ? t : Number(t);
  return Number.isFinite(n) ? n : 0;
}

function pickCreatedAt(o: AnyOrder): number {
  const t = o?.createdAt ?? o?.time ?? o?.placedAt ?? 0;
  const n = typeof t === "number" ? t : Number(t);
  return Number.isFinite(n) ? n : 0;
}

function pickItems(o: AnyOrder): AnyOrder[] {
  const it = o?.items || o?.cartItems || o?.products;
  return Array.isArray(it) ? it : [];
}

export default function AccountOrdersPage() {
  const { user, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState<AnyOrder[]>([]);
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    setNow(Date.now());

    const load = () => setOrders(safeReadOrders());

    load();

    const key = getOrdersKey();
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) load();
    };
    const onCustom = () => load();

    window.addEventListener("storage", onStorage);
    window.addEventListener("amr-orders-updated", onCustom as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("amr-orders-updated", onCustom as any);
    };
  }, []);

  const myOrders = useMemo(() => {
    const me = (user?.email ?? "").toLowerCase();
    if (!me) return [];

    const list = orders
      .filter((o) => pickEmail(o) === me)
      .sort((a, b) => pickCreatedAt(b) - pickCreatedAt(a));

    return list;
  }, [orders, user?.email]);

  if (!isLoggedIn) {
    return (
      <div className="w-full bg-black">
        <div className="max-w-4xl mx-auto px-6 py-12 text-white">
          <h1 className="text-3xl font-bold text-pink-500 mb-3">My Orders</h1>
          <p className="text-gray-300">আপনি লগইন করেননি</p>
          <Link href="/login" className="inline-block mt-4 text-pink-400 hover:text-pink-300">
            Login এ যান →
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

        {myOrders.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
            <p className="text-gray-300">আপনার কোনো অর্ডার এখনো নেই</p>
            <Link href="/products" className="inline-block mt-4 text-pink-400 hover:text-pink-300">
              Products দেখুন →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map((o) => {
              const id = pickId(o);
              const status = pickStatus(o);
              const total = pickTotal(o);
              const createdAt = pickCreatedAt(o);
              const items = pickItems(o);

              return (
                <div key={id} className="bg-zinc-900 border border-zinc-800 rounded p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-400">Order ID</p>
                      <p className="font-semibold text-white break-all">{id}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Date:{" "}
                        {createdAt ? new Date(createdAt).toLocaleString() : now ? new Date(now).toLocaleString() : ""}
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
                      Items দেখুন ({items.length})
                    </summary>

                    <div className="mt-3 space-y-2">
                      {items.length === 0 ? (
                        <p className="text-sm text-gray-400">Items data পাওয়া যায়নি</p>
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
