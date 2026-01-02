"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { safeReadOrders, safeWriteOrders, type Order, type OrderStatus } from "@/app/lib/ordersStore";

const STATUS_LIST: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

function formatStatus(s: OrderStatus) {
  if (s === "PENDING") return "Pending";
  if (s === "PAID") return "Paid";
  if (s === "SHIPPED") return "Shipped";
  if (s === "DELIVERED") return "Delivered";
  return "Cancelled";
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>("");

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (user?.role !== "ADMIN") {
      router.replace("/");
      return;
    }
  }, [isLoggedIn, user?.role, router]);

  useEffect(() => {
    setOrders(safeReadOrders().sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const totalOrders = orders.length;

  const updateStatus = (id: string, next: OrderStatus) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === id ? { ...o, status: next } : o));
      safeWriteOrders(updated);
      return updated;
    });
    setStatusMsg(`Updated order status to ${formatStatus(next)}`);
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => {
      const updated = prev.filter((o) => o.id !== id);
      safeWriteOrders(updated);
      return updated;
    });
    setStatusMsg("Order deleted");
  };

  const deliveredCount = useMemo(() => orders.filter((o) => o.status === "DELIVERED").length, [orders]);

  if (!isLoggedIn || user?.role !== "ADMIN") return null;

  return (
    <div className="w-full bg-black">
      <div className="max-w-6xl mx-auto px-6 py-10 text-white">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pink-500">Admin • Orders</h1>
            <p className="text-gray-400 mt-1">
              Total orders: <span className="text-white font-semibold">{totalOrders}</span>
              {" "}Delivered: <span className="text-white font-semibold">{deliveredCount}</span>
            </p>
            {statusMsg ? <p className="text-sm mt-2 text-pink-400">{statusMsg}</p> : null}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-900 rounded p-6">
            <p className="text-gray-300">No orders yet.</p>
            <p className="text-gray-400 text-sm mt-2">
              Place an order from Checkout and it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="border border-zinc-800 rounded p-5 bg-zinc-900">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-400">
                      Order ID: <span className="text-gray-200">{o.id}</span>
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Date: <span className="text-gray-200">{new Date(o.createdAt).toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Customer: <span className="text-gray-200">{o.customerName}</span>
                      {" "}Phone: <span className="text-gray-200">{o.phone}</span>
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Address: <span className="text-gray-200">{o.address}</span>
                      {" "}City: <span className="text-gray-200">{o.city}</span>
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      User: <span className="text-gray-200">{o.userEmail ?? "Guest"}</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 md:items-end">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-300">Status</span>
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                        className="px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700 outline-none"
                      >
                        {STATUS_LIST.map((s) => (
                          <option key={s} value={s}>
                            {formatStatus(s)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteOrder(o.id)}
                      className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                    >
                      Delete Order
                    </button>
                  </div>
                </div>

                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <p className="font-semibold mb-2">Items</p>
                  <div className="space-y-2">
                    {o.items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between text-gray-300">
                        <span>
                          {it.name} × {it.qty}
                        </span>
                        <span>৳ {it.price * it.qty}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-1 text-gray-300">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>৳ {o.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span>- ৳ {o.discount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>৳ {o.shipping}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-pink-400">৳ {o.total}</span>
                    </div>
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
