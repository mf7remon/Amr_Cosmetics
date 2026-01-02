"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

type OrderStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type PaymentStatus = "INITIATED" | "SUCCESS" | "FAILED" | "CANCELLED";

type StoredOrder = {
  id: string;
  createdAt: number;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    email?: string;
  };
  items?: Array<{ id: string; name: string; price: number; qty: number; lineTotal: number }>;
  subtotal?: number;
  discount?: number;
  finalTotal?: number;
  couponCode?: string | null;
  orderStatus?: OrderStatus;
  payment?: {
    provider?: "SSLCommerz";
    status?: PaymentStatus;
    amount?: number;
    tranId?: string;
  };
};

const ORDERS_KEY = "amr_orders";

function safeReadOrders(): StoredOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredOrder[]) : [];
  } catch {
    return [];
  }
}

export default function AccountOrdersPage() {
  const { user, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState<StoredOrder[]>([]);

  useEffect(() => {
    const load = () => setOrders(safeReadOrders());
    load();

    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === ORDERS_KEY) load();
    };

    window.addEventListener("amr-orders-updated", onCustom);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("amr-orders-updated", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const myEmail = (user?.email ?? "").trim().toLowerCase();

  const myOrders = useMemo(() => {
    if (!isLoggedIn || !myEmail) return [];
    return orders.filter((o) => String(o.customer?.email ?? "").trim().toLowerCase() === myEmail);
  }, [orders, isLoggedIn, myEmail]);

  const guestOrders = useMemo(() => {
    return orders.filter((o) => !String(o.customer?.email ?? "").trim());
  }, [orders]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-pink-500">My Orders</h1>
        <p className="text-gray-400 mt-2">Please login to see your orders.</p>
        <Link href="/login" className="inline-block mt-5 text-pink-400 hover:text-pink-300">
          Go to Login →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-pink-500">My Orders</h1>
          <p className="text-gray-400 mt-1">Orders saved under: {user?.email}</p>
        </div>

        <Link href="/products" className="text-pink-400 hover:text-pink-300">
          Continue shopping →
        </Link>
      </div>

      <div className="mt-8 space-y-10">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">My Account Orders</h2>

          {myOrders.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-900 rounded p-6 text-gray-300">
              No orders yet.
              <div className="text-gray-400 mt-2">Checkout while logged in to see orders here.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((o) => (
                <div key={o.id} className="border border-zinc-800 bg-zinc-900 rounded p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-white font-semibold">Order ID: {o.id}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Date: {new Date(o.createdAt).toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Status: <span className="text-gray-200">{o.orderStatus ?? "PENDING_PAYMENT"}</span>
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Payment: <span className="text-gray-200">{o.payment?.status ?? "INITIATED"}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Total</p>
                      <p className="text-pink-400 font-bold text-lg">৳ {o.finalTotal ?? 0}</p>
                    </div>
                  </div>

                  {o.items?.length ? (
                    <div className="mt-4 border-t border-zinc-800 pt-4 space-y-2">
                      {o.items.map((it) => (
                        <div key={it.id} className="flex justify-between text-gray-300">
                          <span>
                            {it.name} × {it.qty}
                          </span>
                          <span>৳ {it.lineTotal}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {o.couponCode ? (
                    <p className="text-xs text-gray-400 mt-4">Coupon: {o.couponCode}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Guest Orders (this device)</h2>
          {guestOrders.length === 0 ? (
            <p className="text-gray-400">No guest orders found.</p>
          ) : (
            <div className="space-y-4">
              {guestOrders.map((o) => (
                <div key={o.id} className="border border-zinc-800 bg-zinc-900 rounded p-5 opacity-90">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-white font-semibold">Order ID: {o.id}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Date: {new Date(o.createdAt).toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Status: <span className="text-gray-200">{o.orderStatus ?? "PENDING_PAYMENT"}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Total</p>
                      <p className="text-pink-400 font-bold text-lg">৳ {o.finalTotal ?? 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
