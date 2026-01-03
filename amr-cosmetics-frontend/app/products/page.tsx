"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/app/components/ProductCard";
import { Product, safeReadProducts } from "@/app/lib/productsStore";

const CATEGORY_OPTIONS = [
  "All",
  "Clothing",
  "Bags",
  "Jewellery",
  "Beauty care",
  "Footware",
  "Gift",
  "Tech Accessories",
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState<string>("");
  const [activeCat, setActiveCat] = useState<string>("All");

  useEffect(() => {
    setProducts(safeReadProducts());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products
      .filter((p) => {
        if (activeCat === "All") return true;
        const cat = (p.category ?? "").trim();
        return cat === activeCat;
      })
      .filter((p) => {
        if (!q) return true;
        const hay = `${p.title} ${p.description ?? ""} ${p.category ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [products, query, activeCat]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-pink-500">Products</h1>
          <p className="text-gray-400 mt-1">Search and browse by category</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full sm:w-[320px] px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-pink-500"
          />

          <select
            value={activeCat}
            onChange={(e) => setActiveCat(e.target.value)}
            className="w-full sm:w-[220px] px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-pink-500"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setProducts(safeReadProducts())}
            className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-8">
        {filtered.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-900 rounded p-6 text-gray-300">
            No products found.
            <div className="text-gray-400 mt-2">
              Search change করো বা category বদলাও, আর product add হবে শুধু Admin থেকে।
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
