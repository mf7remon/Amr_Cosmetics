"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { safeReadUserOrders, Order } from "@/app/lib/ordersStore";

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function statusBadge(status: Order["status"]) {
  const base = "inline-block px-3 py-1 rounded text-xs font-semibold border";
  if (status === "DELIVERED") return `${base} border-green-700 text-green-300 bg-green-950`;
  if (status === "SHIPPED") return `${base} border-blue-700 text-blue-300 bg-blue-950`;
  if (status === "PROCESSING") return `${base} border-yellow-700 text-yellow-300 bg-yellow-950`;
  if (status === "CANCELLED") return `${base} border-red-700 text-red-300 bg-red-950`;
  return `${base} border-zinc-700 text-gray-200 bg-zinc-950`;
}

export default function MyOrdersPage() {
  const { user, isLoggedIn } = useAuth();

  const email = useMemo(() => {
    if (!isLoggedIn || !user?.email) return null;
    return user.email;
  }, [isLoggedIn, user?.email]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");

  const load = () => {
    const list = safeReadUserOrders(email);
    setOrders(list);
  };

  useEffect(() => {
    load();

    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith("amr_orders_v1")) load();
    };

    window.addEventListener("amr-orders-updated", onCustom);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("amr-orders-updated", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [email]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return [...orders]
      .filter((o) => {
        if (!query) return true;
        const hay = `${o.id} ${o.status} ${o.city} ${o.phone}`.toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, q]);

  if (!isLoggedIn) {
    return (
      <div className="w-full bg-black">
        <div className="max-w-4xl mx-auto px-6 py-10 text-white">
          <h1 className="text-3xl font-bold text-pink-500">My Orders</h1>
          <p className="text-gray-300 mt-2">Orders দেখতে হলে আগে login করতে হবে।</p>

          <Link href="/login" className="inline-block mt-4 text-pink-400 hover:text-pink-300">
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black">
      <div className="max-w-6xl mx-auto px-6 py-10 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-pink-500">My Orders</h1>
            <p className="text-gray-400 mt-2">
              এখানে তোমার করা সব order দেখা যাবে এবং admin status update করলে সেটাও এখানে update হয়ে দেখাবে।
            </p>
          </div>

          <Link href="/account" className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500 h-fit">
            ← Back
          </Link>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by order id or status..."
            className="w-full sm:w-[360px] px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-pink-500"
          />

          <button
            type="button"
            onClick={load}
            className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6">
          {filtered.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-900 rounded p-6 text-gray-300">
              No orders yet.
              <div className="text-gray-400 mt-2">
                Order করতে <span className="text-pink-400">Checkout</span> এ গিয়ে Place Order দাও।
              </div>

              <Link href="/products" className="inline-block mt-4 text-pink-400 hover:text-pink-300">
                Shop Products →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((o) => (
                <div key={o.id} className="border border-zinc-800 bg-zinc-900 rounded p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-white break-all">{o.id}</p>
                        <span className={statusBadge(o.status)}>{o.status}</span>
                      </div>

                      <p className="text-sm text-gray-400 mt-2">
                        Created: {formatDate(o.createdAt)}
                      </p>

                      <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">Items</p>
                        <div className="space-y-2">
                          {o.items.map((it) => (
                            <div key={`${o.id}-${it.id}`} className="flex items-center justify-between text-gray-300">
                              <span>
                                {it.name} × {it.qty}
                              </span>
                              <span>৳ {it.price * it.qty}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 border-t border-zinc-800 pt-4">
                        <div className="flex justify-between text-gray-300">
                          <span>Total</span>
                          <span className="text-pink-400 font-bold">৳ {o.total}</span>
                        </div>

                        {o.coupon ? (
                          <p className="text-xs text-gray-400 mt-2">
                            Coupon: {o.coupon.code} ({o.coupon.value}%)
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-2">Coupon: None</p>
                        )}
                      </div>
                    </div>

                    <div className="w-full lg:w-[260px] border border-zinc-800 bg-zinc-950 rounded p-4">
                      <p className="text-sm text-gray-400">Delivery</p>
                      <p className="text-white mt-1">
                        {o.address}, {o.city}
                      </p>

                      <p className="text-sm text-gray-400 mt-3">Phone</p>
                      <p className="text-white mt-1">{o.phone}</p>

                      <p className="text-xs text-gray-500 mt-3">
                        Updated: {formatDate(o.updatedAt || o.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-600 mt-8">
          Note: এইটা frontend localStorage demo system, backend হলে real order history থাকবে।
        </p>
      </div>
    </div>
  );
}
