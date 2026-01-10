"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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

function SkeletonProductCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow animate-pulse">
      <div className="h-56 bg-zinc-800" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-24 bg-zinc-800 rounded" />
        <div className="h-5 w-3/4 bg-zinc-800 rounded" />
        <div className="h-4 w-1/2 bg-zinc-800 rounded" />
        <div className="h-10 w-full bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [query, setQuery] = useState<string>("");
  const [activeCat, setActiveCat] = useState<string>("All");

  useEffect(() => {
    const load = () => {
      setProducts(safeReadProducts());
      setLoaded(true);
    };

    setLoaded(false);
    load();

    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "amr_products") load();
    };

    window.addEventListener("amr-products-updated", onCustom as any);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("amr-products-updated", onCustom as any);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // ✅ build category options dynamically (so K-Beauty / J-Beauty also appears)
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of CATEGORY_OPTIONS) {
      if (c !== "All") set.add(c);
    }
    for (const p of products) {
      const c = (p.category ?? "").trim();
      if (c) set.add(c);
    }
    return ["All", ...Array.from(set)];
  }, [products]);

  // ✅ read ?cat=K-Beauty from URL and set category
  useEffect(() => {
    const urlCat = (searchParams.get("cat") ?? "").trim();
    if (!urlCat) return;

    // If it exists in options, set it; otherwise still set it (works if products have it)
    setActiveCat(urlCat);
  }, [searchParams]);

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

  const hasFilters = query.trim().length > 0 || activeCat !== "All";

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-pink-500">Products</h1>
          <p className="text-gray-400 mt-1">Search and browse by category</p>

          <p className="text-sm text-gray-400 mt-2">
            {loaded
              ? `${filtered.length} product${filtered.length === 1 ? "" : "s"} found`
              : "Loading products..."}
          </p>
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
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setLoaded(false);
              setProducts(safeReadProducts());
              setLoaded(true);
            }}
            className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500 transition"
          >
            Refresh
          </button>

          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCat("All");
              }}
              className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500 transition text-gray-200"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonProductCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
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
