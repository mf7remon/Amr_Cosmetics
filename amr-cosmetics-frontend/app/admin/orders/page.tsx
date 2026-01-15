"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  safeReadAllOrders,
  updateOrderStatusInStorage,
  Order,
  OrderStatus,
} from "@/app/lib/ordersStore";

const STATUS_OPTIONS: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [q, setQ] = useState("");

  const load = () => setOrders(safeReadAllOrders());

  useEffect(() => {
    load();

    const onCustom = () => load();
    window.addEventListener("amr-orders-updated", onCustom);

    return () => {
      window.removeEventListener("amr-orders-updated", onCustom);
    };
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return orders
      .filter((o) => (statusFilter === "ALL" ? true : o.status === statusFilter))
      .filter((o) => {
        if (!query) return true;
        const hay = `${o.id} ${o.customerName} ${o.customerEmail} ${o.phone} ${o.city}`.toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, statusFilter, q]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: orders.length };
    for (const s of STATUS_OPTIONS) map[s] = orders.filter((o) => o.status === s).length;
    return map;
  }, [orders]);

  const setStatus = (orderId: string, status: OrderStatus) => {
    updateOrderStatusInStorage(orderId, status);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-pink-500">Admin • Orders</h1>
        </div>

        <Link
          href="/admin"
          className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500 h-fit"
        >
          ← Back
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
          <p className="text-gray-400 text-sm">Total Orders</p>
          <p className="text-2xl font-bold mt-2">{counts.ALL}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
          <p className="text-gray-400 text-sm">Pending</p>
          <p className="text-2xl font-bold mt-2">{counts.PENDING}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
          <p className="text-gray-400 text-sm">Delivered</p>
          <p className="text-2xl font-bold mt-2">{counts.DELIVERED}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex gap-3 flex-col sm:flex-row w-full md:w-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by order id, email, name..."
            className="w-full sm:w-[320px] px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-pink-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-[220px] px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-pink-500"
          >
            <option value="ALL">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={load}
            className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-900 rounded p-6 text-gray-300">
            No orders found.
            <div className="text-gray-400 mt-2">Checkout থেকে Place Order করলে এখানে order দেখা যাবে।</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((o) => (
              <div key={o.id} className="border border-zinc-800 bg-zinc-900 rounded p-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-400">Order ID</p>
                    <p className="font-semibold text-white break-all">{o.id}</p>

                    {/* ✅ Payment method line added */}
                    <p className="text-sm text-gray-400 mt-2">
                      Payment Method: <span className="text-gray-200">{o.paymentMethod || "—"}</span>
                    </p>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-400">Customer</p>
                        <p className="text-white">{o.customerName}</p>
                        <p className="text-gray-300 text-sm break-all">{o.customerEmail}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400">Phone</p>
                        <p className="text-white">{o.phone}</p>
                        <p className="text-sm text-gray-400 mt-1">Created: {formatDate(o.createdAt)}</p>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-sm text-gray-400">Address</p>
                        <p className="text-white">
                          {o.address}, {o.city}
                        </p>
                      </div>
                    </div>

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
                        <span>Subtotal</span>
                        <span>৳ {o.subtotal}</span>
                      </div>

                      <div className="flex justify-between text-gray-300 mt-2">
                        <span>Discount</span>
                        <span>- ৳ {o.discountAmount}</span>
                      </div>

                      <div className="flex justify-between font-bold text-lg mt-3">
                        <span>Total</span>
                        <span className="text-pink-400">৳ {o.total}</span>
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
                    <p className="text-sm text-gray-400">Status</p>
                    <p className="text-white font-semibold mt-1">{o.status}</p>

                    <select
                      value={o.status}
                      onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
                      className="w-full mt-3 px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-pink-500"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStatus(o.id, "PROCESSING")}
                        className="border border-zinc-700 px-3 py-2 rounded hover:border-pink-500 text-sm"
                      >
                        Processing
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(o.id, "SHIPPED")}
                        className="border border-zinc-700 px-3 py-2 rounded hover:border-pink-500 text-sm"
                      >
                        Shipped
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(o.id, "DELIVERED")}
                        className="bg-pink-600 px-3 py-2 rounded hover:opacity-90 text-sm col-span-2"
                      >
                        Mark Delivered ✅
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(o.id, "CANCELLED")}
                        className="border border-zinc-700 px-3 py-2 rounded hover:border-pink-500 text-sm col-span-2"
                      >
                        Cancel
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      Updated: {o.updatedAt ? formatDate(o.updatedAt) : formatDate(o.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
