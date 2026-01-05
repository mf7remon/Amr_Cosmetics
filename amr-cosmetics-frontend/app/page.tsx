"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/app/context/CartContext";
import { Product, safeReadProducts } from "@/app/lib/productsStore";

const ROTATE_MS = 5000;

function normalize(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function buildCategories(products: Product[]) {
  const set = new Set<string>();
  for (const p of products) {
    if (p.category?.trim()) set.add(p.category.trim());
  }
  const cats = Array.from(set).sort((a, b) => a.localeCompare(b));
  return ["All", ...cats];
}

function pickTrending(products: Product[]) {
  const copy = [...products];
  copy.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return copy;
}

function ProductCardHome({
  p,
  size,
  onAdd,
}: {
  p: Product;
  size: "sm" | "lg";
  onAdd: () => void;
}) {
  const img = p.imageUrl?.trim() ?? "";
  const h = size === "lg" ? "h-56" : "h-48";
  const titleSize = size === "lg" ? "text-base" : "text-sm";
  const priceSize = size === "lg" ? "text-base" : "text-sm";

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden hover:border-pink-500 transition">
      <Link href={`/product/${p.slug}`} className="block">
        <div className={`w-full ${h} bg-zinc-900`}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={p.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
              No Image
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        {p.category ? (
          <p className="text-[11px] text-gray-400 mb-1">{p.category}</p>
        ) : null}

        <p className={`font-semibold text-white ${titleSize} line-clamp-1`}>
          {p.title}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-1 text-pink-400 text-sm">
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </div>
          <p className={`text-pink-400 font-bold ${priceSize}`}>৳ {p.price}</p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="mt-4 w-full py-2 rounded-xl bg-black border border-zinc-800 hover:border-pink-500 text-sm"
        >
          Add To Cart
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { addItem } = useCart();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [activeCat, setActiveCat] = useState<string>("All");

  const [trendIndex, setTrendIndex] = useState(0);

  useEffect(() => {
    setProducts(safeReadProducts());

    const onFocus = () => setProducts(safeReadProducts());
    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const categories = useMemo(() => buildCategories(products), [products]);

  const trendingList = useMemo(() => pickTrending(products), [products]);

  const filteredProducts = useMemo(() => {
    if (activeCat === "All") return products;
    return products.filter((p) => normalize(p.category) === normalize(activeCat));
  }, [products, activeCat]);

  useEffect(() => {
    if (activeCat !== "All") return;
    if (trendingList.length <= 3) return;

    const t = window.setInterval(() => {
      setTrendIndex((x) => x + 1);
    }, ROTATE_MS);

    return () => window.clearInterval(t);
  }, [activeCat, trendingList.length]);

  const triple = useMemo(() => {
    if (trendingList.length === 0) return [];
    const n = trendingList.length;
    const a = trendingList[trendIndex % n];
    const b = trendingList[(trendIndex + 1) % n];
    const c = trendingList[(trendIndex + 2) % n];
    return [a, b, c] as Product[];
  }, [trendingList, trendIndex]);

  function handleAdd(p: Product) {
    addItem({ id: p.id, name: p.title, price: p.price });
  }

  function selectCategory(c: string) {
    setActiveCat(c);
    setDrawerOpen(false);
  }

  const viewingText = activeCat === "All" ? "Viewing Trending" : `Viewing: ${activeCat}`;

  return (
    <div className="w-full bg-black text-white">
      {/* Drawer overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-[300px] z-50 bg-zinc-950 border-r border-zinc-800 transition-transform ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-zinc-800">
          <p className="font-semibold text-white text-sm">Browse Categories</p>
          <button
            className="h-9 w-9 rounded bg-zinc-900 border border-zinc-800 hover:border-pink-500"
            onClick={() => setDrawerOpen(false)}
            type="button"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-3">
          {categories.map((c) => {
            const isActive = c === activeCat;
            return (
              <button
                key={c}
                type="button"
                onClick={() => selectCategory(c)}
                className={`w-full text-left px-4 py-3 rounded mb-2 border transition text-sm ${
                  isActive
                    ? "bg-pink-500/15 border-pink-500 text-pink-300"
                    : "bg-zinc-900 border-zinc-800 text-gray-200 hover:border-pink-500"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </aside>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top row: hamburger + centered viewing label */}
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-pink-500 flex items-center justify-center"
            aria-label="Open categories"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex-1 text-center">
            <p className="text-sm text-gray-300">{viewingText}</p>
            {activeCat === "All" ? (
              <p className="text-xs text-gray-500 mt-1">Auto updates every 5 seconds</p>
            ) : (
              <button
                type="button"
                onClick={() => setActiveCat("All")}
                className="text-xs text-pink-400 hover:text-pink-300 mt-1"
              >
                Back to Trending
              </button>
            )}
          </div>

          <div className="w-12" />
        </div>

        {/* Hero */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-10">
          <p className="text-xs text-gray-400">Amr Cosmetics</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            Beauty that belongs to <span className="text-pink-500">you</span>
          </h1>
          <p className="text-sm text-gray-300 mt-3 max-w-2xl">
            Premium beauty essentials and lifestyle picks, curated with care for everyday confidence.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="bg-pink-500 hover:bg-pink-600 px-5 py-2.5 rounded-xl font-semibold text-sm"
            >
              Shop Products
            </Link>

            <Link
              href="/account/coupons"
              className="bg-black border border-zinc-800 hover:border-pink-500 px-5 py-2.5 rounded-xl font-semibold text-sm"
            >
              My Coupons
            </Link>

            <Link
              href="/cart"
              className="bg-black border border-zinc-800 hover:border-pink-500 px-5 py-2.5 rounded-xl font-semibold text-sm"
            >
              Cart
            </Link>
          </div>
        </div>

        {/* Trending */}
        {activeCat === "All" ? (
          <div className="mt-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold">Trending</h2>
                <p className="text-sm text-gray-400 mt-1">Latest products from your store</p>
              </div>

              <Link href="/products" className="text-sm text-pink-400 hover:text-pink-300">
                View all →
              </Link>
            </div>

            {triple.length === 0 ? (
              <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-gray-400">
                এখনো কোনো product নেই, admin থেকে product add করলে এখানে দেখাবে।
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <ProductCardHome p={triple[0]} size="sm" onAdd={() => handleAdd(triple[0])} />
                <div className="md:-translate-y-2">
                  <ProductCardHome p={triple[1]} size="lg" onAdd={() => handleAdd(triple[1])} />
                </div>
                <ProductCardHome p={triple[2]} size="sm" onAdd={() => handleAdd(triple[2])} />
              </div>
            )}
          </div>
        ) : (
          /* Category view */
          <div className="mt-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold">{activeCat}</h2>
                <p className="text-sm text-gray-400 mt-1">Products in this category</p>
              </div>

              <Link href="/products" className="text-sm text-pink-400 hover:text-pink-300">
                Open Products →
              </Link>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-gray-400">
                এই category তে এখনো কোনো product নেই।
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.slice(0, 12).map((p) => (
                  <ProductCardHome key={p.id} p={p} size="sm" onAdd={() => handleAdd(p)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
