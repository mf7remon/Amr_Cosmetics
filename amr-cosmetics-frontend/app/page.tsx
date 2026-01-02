"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { safeReadProducts, type Product } from "@/app/lib/productsStore";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setProducts(safeReadProducts().sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const trending = useMemo(() => products.slice(0, 10), [products]);

  useEffect(() => {
    if (trending.length <= 1) return;

    const t = window.setInterval(() => {
      setIdx((prev) => (prev + 1) % trending.length);
    }, 5000);

    return () => window.clearInterval(t);
  }, [trending.length]);

  const current = trending.length > 0 ? trending[idx] : null;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        Welcome to <span className="text-pink-500">Amr Cosmetics</span> 💄
      </h1>
      <p className="text-gray-300 mb-10">Beauty that belongs to you</p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/products"
          className="bg-pink-500 hover:bg-pink-600 px-6 py-3 rounded font-semibold"
        >
          Shop Products
        </Link>

        <Link
          href="/account/spin"
          className="border border-zinc-700 hover:border-pink-500 px-6 py-3 rounded font-semibold"
        >
          Spin to Win 🎡
        </Link>

        <Link
          href="/account/coupons"
          className="border border-zinc-700 hover:border-pink-500 px-6 py-3 rounded font-semibold"
        >
          My Coupons
        </Link>
      </div>

      <div className="mt-14 w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-pink-500 mb-4">Trending Now</h2>

        {!current ? (
          <div className="border border-zinc-800 bg-zinc-900 rounded p-6 text-gray-300">
            No products yet. Add products from Admin → Products.
          </div>
        ) : (
          <div className="border border-zinc-800 bg-zinc-900 rounded-xl overflow-hidden text-left">
            <div className="h-56 bg-zinc-800 flex items-center justify-center">
              {current.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.imageUrl}
                  alt={current.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-gray-400">No Image</span>
              )}
            </div>

            <div className="p-6">
              <p className="text-xs text-gray-400 mb-1">{current.category ?? "Uncategorized"}</p>
              <h3 className="text-xl font-bold">{current.title}</h3>
              <p className="text-pink-400 font-bold mt-2">৳ {current.price}</p>

              <div className="mt-5 flex gap-3">
                <Link
                  href="/products"
                  className="px-5 py-2 rounded bg-pink-600 hover:opacity-90"
                >
                  View Products
                </Link>
                <Link
                  href={`/product/${current.slug}`}
                  className="px-5 py-2 rounded border border-zinc-700 hover:border-pink-500"
                >
                  View Details
                </Link>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Auto changes every 5 seconds.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
