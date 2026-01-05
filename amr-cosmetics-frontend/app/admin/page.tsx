"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

import { safeReadProducts } from "@/app/lib/productsStore";
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

function readArrayFromKey(key: string): AnyOrder[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<unknown>(window.localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as AnyOrder[]) : [];
}

function getOrderCreatedAt(o: AnyOrder): number {
  const t = o?.createdAt ?? o?.placedAt ?? o?.time ?? o?.date ?? 0;
  const n = typeof t === "number" ? t : Number(t);
  return Number.isFinite(n) ? n : 0;
}

function isToday(ts: number): boolean {
  if (!ts) return false;
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function getOrderId(o: AnyOrder): string {
  const id = o?.id ?? o?.orderId ?? o?.code ?? o?._id;
  if (typeof id === "string") return id;
  if (typeof id === "number") return String(id);
  return String(id ?? "");
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

function readAllOrdersRobust(): AnyOrder[] {
  if (typeof window === "undefined") return [];

  const anyStore = OrdersStore as any;

  const fnAll = anyStore?.safeReadAllOrders;
  if (typeof fnAll === "function") {
    try {
      const res = fnAll();
      if (Array.isArray(res)) return dedupeById(res);
    } catch {}
  }

  const fn = anyStore?.safeReadOrders;
  if (typeof fn === "function") {
    try {
      const res = fn();
      if (Array.isArray(res) && res.length) return dedupeById(res);
    } catch {}
  }

  // fallback scan localStorage keys for per-user orders like amr_orders_v1:email
  let collected: AnyOrder[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k) continue;
      const low = k.toLowerCase();
      if (!low.startsWith("amr_orders")) continue;
      const arr = readArrayFromKey(k);
      if (arr.length) collected = collected.concat(arr);
    }
  } catch {}

  // fallback global keys too
  const globals = ["amr_orders_v1", "amr_orders", "amr_all_orders_v1", "amr_all_orders"];
  for (const k of globals) {
    const arr = readArrayFromKey(k);
    if (arr.length) collected = collected.concat(arr);
  }

  return dedupeById(collected);
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();

  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [ordersToday, setOrdersToday] = useState<number>(0);

  useEffect(() => {
    if (!isLoggedIn) router.push("/login");
    else if (user?.role !== "ADMIN") router.push("/account");
  }, [isLoggedIn, user, router]);

  useEffect(() => {
    const reloadStats = () => {
      try {
        const prods = safeReadProducts();
        setTotalProducts(Array.isArray(prods) ? prods.length : 0);
      } catch {
        setTotalProducts(0);
      }

      try {
        const all = readAllOrdersRobust();
        const todayCount = all.filter((o) => isToday(getOrderCreatedAt(o))).length;
        setOrdersToday(todayCount);
      } catch {
        setOrdersToday(0);
      }
    };

    reloadStats();

    const onCustom = () => reloadStats();

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      const k = e.key.toLowerCase();
      if (k.startsWith("amr_orders") || k === "amr_products") reloadStats();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("amr-orders-updated", onCustom as any);
    window.addEventListener("amr_orders_updated", onCustom as any);
    window.addEventListener("amr-products-updated", onCustom as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("amr-orders-updated", onCustom as any);
      window.removeEventListener("amr_orders_updated", onCustom as any);
      window.removeEventListener("amr-products-updated", onCustom as any);
    };
  }, []);

  if (!isLoggedIn || user?.role !== "ADMIN") {
    return (
      <div className="w-full">
        <div className="max-w-6xl mx-auto px-6 py-12 text-white">
          <p className="text-gray-300">Checking access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-6 py-12 text-white">
        <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-pink-500">
              Admin Dashboard
            </h1>
            <p className="text-gray-300 mt-2">
              Welcome, <span className="text-white font-semibold">{user.name}</span> — manage your store here.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800"
            >
              View Site
            </Link>
            <Link
              href="/products"
              className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800"
            >
              Products Page
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded p-5">
            <p className="text-gray-400 text-sm">Total Products</p>
            <p className="text-2xl font-bold mt-2">{totalProducts}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded p-5">
            <p className="text-gray-400 text-sm">Orders Today</p>
            <p className="text-2xl font-bold mt-2">{ordersToday}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded p-5">
            <p className="text-gray-400 text-sm">Active Coupons</p>
            <p className="text-2xl font-bold mt-2">4</p>
          </div>
        </div>

        <h2 className="text-xl font-semibold mt-10 mb-4">Quick Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/products"
            className="bg-zinc-900 border border-zinc-800 rounded p-6 hover:bg-zinc-800 transition"
          >
            <h3 className="text-xl font-bold">Manage Products</h3>
            <p className="text-gray-300 text-sm mt-2">Add / Edit / Remove products</p>
            <p className="text-pink-400 text-sm mt-4">Open →</p>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-zinc-900 border border-zinc-800 rounded p-6 hover:bg-zinc-800 transition"
          >
            <h3 className="text-xl font-bold">Orders</h3>
            <p className="text-gray-300 text-sm mt-2">View customer orders & status</p>
            <p className="text-pink-400 text-sm mt-4">Open →</p>
          </Link>

          <Link
            href="/admin/coupons"
            className="bg-zinc-900 border border-zinc-800 rounded p-6 hover:bg-zinc-800 transition"
          >
            <h3 className="text-xl font-bold">Coupons</h3>
            <p className="text-gray-300 text-sm mt-2">Manage discount coupons</p>
            <p className="text-pink-400 text-sm mt-4">Open →</p>
          </Link>
        </div>

        <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded p-5">
          <p className="text-gray-300">Next we will build these pages:</p>
          <ul className="list-disc pl-6 mt-2 text-gray-400">
            <li>/admin/products</li>
            <li>/admin/orders</li>
            <li>/admin/coupons</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
