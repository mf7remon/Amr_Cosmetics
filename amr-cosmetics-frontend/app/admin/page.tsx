"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { safeReadProducts } from "@/app/lib/productsStore";
import { useCoupons } from "@/app/context/CouponContext";

export default function AdminPage() {
  const { user } = useAuth();
  const { coupons } = useCoupons();

  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    const load = () => setProductCount(safeReadProducts().length);
    load();
    window.addEventListener("amr-products-updated", load);
    return () => window.removeEventListener("amr-products-updated", load);
  }, []);

  const activeCouponCount = useMemo(() => {
    const now = Date.now();
    return coupons.filter((c) => !c.used && c.expiresAt > now).length;
  }, [coupons]);

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-6 py-12 text-white">
        <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-pink-500">Admin Dashboard</h1>
            <p className="text-gray-300 mt-2">
              Welcome, <span className="text-white font-semibold">{user?.name}</span> — manage your store here.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/" className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800">
              View Site
            </Link>
            <Link href="/products" className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800">
              Products Page
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded p-5">
            <p className="text-gray-400 text-sm">Total Products</p>
            <p className="text-2xl font-bold mt-2">{productCount}</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded p-5">
            <p className="text-gray-400 text-sm">Orders Today</p>
            <p className="text-2xl font-bold mt-2">0</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded p-5">
            <p className="text-gray-400 text-sm">Active Coupons</p>
            <p className="text-2xl font-bold mt-2">{activeCouponCount}</p>
          </div>
        </div>

        <h2 className="text-xl font-semibold mt-10 mb-4">Quick Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/products" className="bg-zinc-900 border border-zinc-800 rounded p-6 hover:bg-zinc-800 transition">
            <h3 className="text-xl font-bold">Manage Products</h3>
            <p className="text-gray-300 text-sm mt-2">Add / Edit / Remove products</p>
            <p className="text-pink-400 text-sm mt-4">Open →</p>
          </Link>

          <Link href="/admin/orders" className="bg-zinc-900 border border-zinc-800 rounded p-6 hover:bg-zinc-800 transition">
            <h3 className="text-xl font-bold">Orders</h3>
            <p className="text-gray-300 text-sm mt-2">View customer orders & status</p>
            <p className="text-pink-400 text-sm mt-4">Open →</p>
          </Link>

          <Link href="/admin/coupons" className="bg-zinc-900 border border-zinc-800 rounded p-6 hover:bg-zinc-800 transition">
            <h3 className="text-xl font-bold">Coupons</h3>
            <p className="text-gray-300 text-sm mt-2">Manage discount coupons</p>
            <p className="text-pink-400 text-sm mt-4">Open →</p>
          </Link>
        </div>

        <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded p-5">
          <p className="text-gray-300">Next we will build these pages:</p>
          <ul className="list-disc pl-6 mt-2 text-gray-400">
            <li>/admin/orders (backend needed)</li>
            <li>/admin/coupons (we will improve later)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
