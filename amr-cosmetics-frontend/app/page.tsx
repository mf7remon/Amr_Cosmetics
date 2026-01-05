"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TrendingShowcase from "@/app/components/TrendingShowcase";
import HomeCategoryDrawer from "@/app/components/HomeCategoryDrawer";
import ProductCard from "@/app/components/ProductCard";
import { SITE_CONFIG } from "@/app/lib/siteConfig";
import { Product, safeReadProducts } from "@/app/lib/productsStore";

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // "Trending" means only big trending, no grid
  const [activeView, setActiveView] = useState<string>("Trending");

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = () => setProducts(safeReadProducts());

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

  const categories = useMemo(() => {
    return ["Trending", "All", ...SITE_CONFIG.categories];
  }, []);

  const latestSorted = useMemo(() => {
    const copy = [...products];
    copy.sort((a, b) => b.createdAt - a.createdAt);
    return copy;
  }, [products]);

  const trendingSource = useMemo(() => {
    if (activeView === "Trending" || activeView === "All") return latestSorted;
    return latestSorted.filter((p) => (p.category ?? "") === activeView);
  }, [latestSorted, activeView]);

  const showGrid = useMemo(() => activeView !== "Trending", [activeView]);

  const gridProducts = useMemo(() => {
    if (activeView === "All") return latestSorted;
    if (activeView === "Trending") return [];
    return latestSorted.filter((p) => (p.category ?? "") === activeView);
  }, [activeView, latestSorted]);

  return (
    <div className="w-full bg-black">
      <div className="max-w-7xl mx-auto px-6 py-10 text-white">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="h-10 w-10 rounded bg-zinc-900 border border-zinc-800 hover:border-pink-500 flex items-center justify-center"
            aria-label="Open categories"
          >
            <HamburgerIcon />
          </button>

          <div className="text-right">
            <p className="text-[11px] text-gray-500">Viewing</p>
            <p className="text-sm text-white font-semibold">{activeView}</p>
          </div>
        </div>

        <HomeCategoryDrawer
          open={drawerOpen}
          categories={categories}
          active={activeView}
          onClose={() => setDrawerOpen(false)}
          onSelect={(c) => setActiveView(c)}
        />

        {/* Hero */}
        <div className="mt-8 border border-zinc-800 bg-zinc-900 rounded-2xl p-7 sm:p-8">
          <p className="text-xs text-gray-400">Welcome</p>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 leading-tight">
            <span className="text-white">Amr Cosmetics</span>{" "}
            <span className="text-pink-500">Store</span>
          </h1>

          <p className="text-sm text-gray-300 mt-3">
            Beauty that belongs to you
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="bg-pink-500 hover:bg-pink-600 px-5 py-2.5 rounded font-semibold text-sm"
            >
              Shop Products
            </Link>

            <Link
              href="/account/coupons"
              className="border border-zinc-700 hover:border-pink-500 px-5 py-2.5 rounded font-semibold text-sm"
            >
              My Coupons
            </Link>

            <Link
              href="/cart"
              className="border border-zinc-700 hover:border-pink-500 px-5 py-2.5 rounded font-semibold text-sm"
            >
              Cart
            </Link>
          </div>
        </div>

        {/* Trending */}
        <TrendingShowcase
          products={trendingSource}
          title={activeView === "Trending" ? "Trending Now" : "Trending (Compact)"}
          variant={activeView === "Trending" ? "large" : "compact"}
          intervalMs={5000}
        />

        {/* Category Grid */}
        {showGrid ? (
          <section className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {activeView === "All" ? "All Products" : `${activeView} Products`}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Category select করলে নিচে products show করবে
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveView("Trending")}
                className="text-sm border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
              >
                Back to Trending
              </button>
            </div>

            {gridProducts.length === 0 ? (
              <div className="mt-4 border border-zinc-800 bg-zinc-900 rounded p-6 text-gray-300">
                এই category তে কোনো product নেই।
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {gridProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
