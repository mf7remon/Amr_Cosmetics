"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/app/components/ProductCard";
import { Product, safeReadProducts } from "@/app/lib/productsStore";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState<string>("");
  const [activeCat, setActiveCat] = useState<string>("All");

  useEffect(() => {
    setProducts(safeReadProducts());
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category?.trim()) set.add(p.category.trim());
    }
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products
      .filter((p) => (activeCat === "All" ? true : (p.category ?? "") === activeCat))
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
          <h1 className="text-3xl font-bold text-pink-500">Our Products</h1>
          <p className="text-gray-400 mt-1">Find your perfect match</p>
        </div>

        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full sm:w-[320px] px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-pink-500"
          />
          <button
            type="button"
            onClick={() => setProducts(safeReadProducts())}
            className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* LEFT SIDEBAR (Categories) */}
        <aside className="border border-zinc-800 bg-zinc-900 rounded-xl p-5 h-fit">
          <h2 className="text-lg font-semibold text-white mb-4">Categories</h2>

          <div className="flex flex-wrap lg:flex-col gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCat(c)}
                className={
                  c === activeCat
                    ? "text-left px-3 py-2 rounded bg-pink-600 text-white"
                    : "text-left px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-gray-200 hover:border-pink-500"
                }
              >
                {c}
              </button>
            ))}
          </div>
        </aside>

        {/* PRODUCT GRID */}
        <section>
          {filtered.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-900 rounded p-6 text-gray-300">
              No products found.
              <div className="text-gray-400 mt-2">
                Add products from <span className="text-pink-400">Admin → Products</span> or change filters.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
