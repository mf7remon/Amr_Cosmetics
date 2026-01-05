"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/app/context/CartContext";

type Product = {
  id: string;
  title: string;
  slug?: string;
  price: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  createdAt?: number;
};

const CATEGORIES_FALLBACK = [
  "All",
  "Clothing",
  "Bags",
  "Jewellery",
  "Beauty care",
  "Footware",
  "Gift",
  "Tech Accessories",
];

function safeJson<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readProductsFromStorage(): Product[] {
  if (typeof window === "undefined") return [];

  // try newer key first
  const v1 = safeJson<Product[]>(localStorage.getItem("amr_products_v1"), []);
  if (Array.isArray(v1) && v1.length) return v1;

  const old = safeJson<Product[]>(localStorage.getItem("amr_products"), []);
  if (Array.isArray(old)) return old;

  return [];
}

function readCategoriesFromStorage(): string[] {
  if (typeof window === "undefined") return CATEGORIES_FALLBACK;

  const stored = safeJson<string[]>(localStorage.getItem("amr_categories"), []);
  const cleaned = Array.isArray(stored)
    ? stored.map((c) => String(c).trim()).filter(Boolean)
    : [];

  const finalList = ["All", ...cleaned.filter((x) => x.toLowerCase() !== "all")];
  return finalList.length ? finalList : CATEGORIES_FALLBACK;
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function StarRow() {
  return (
    <div className="flex gap-1 text-pink-400 text-sm">
      {"★★★★★".split("").map((s, i) => (
        <span key={i}>{s}</span>
      ))}
    </div>
  );
}

export default function Home() {
  const { addItem } = useCart();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(CATEGORIES_FALLBACK);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [trendIndex, setTrendIndex] = useState(0);

  useEffect(() => {
    setCategories(readCategoriesFromStorage());
    setProducts(readProductsFromStorage());
  }, []);

  // Trending list: latest first
  const trending = useMemo(() => {
    const list = [...products];
    list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return list;
  }, [products]);

  const categoryProducts = useMemo(() => {
    if (selectedCategory === "All") return [];
    return products.filter(
      (p) => (p.category ?? "").toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [products, selectedCategory]);

  // rotate trending every 5 seconds (only when All selected)
  useEffect(() => {
    if (selectedCategory !== "All") return;
    if (trending.length <= 1) return;

    const t = setInterval(() => {
      setTrendIndex((prev) => (prev + 1) % trending.length);
    }, 5000);

    return () => clearInterval(t);
  }, [trending.length, selectedCategory]);

  const trending3 = useMemo(() => {
    if (trending.length === 0) return [];
    const a = trending[trendIndex % trending.length];
    const b = trending[(trendIndex + 1) % trending.length];
    const c = trending[(trendIndex + 2) % trending.length];

    // remove duplicates if less products
    const uniq: Product[] = [];
    for (const it of [a, b, c]) {
      if (!uniq.find((x) => x.id === it.id)) uniq.push(it);
    }
    return uniq;
  }, [trending, trendIndex]);

  function handlePickCategory(cat: string) {
    setSelectedCategory(cat);
    setDrawerOpen(false);
  }

  function ProductCard({
    p,
    emphasis = false,
  }: {
    p: Product;
    emphasis?: boolean;
  }) {
    return (
      <div
        className={[
          "rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden",
          "hover:bg-zinc-900 transition",
          emphasis ? "scale-[1.05]" : "",
        ].join(" ")}
      >
        <div className="relative h-44 bg-zinc-800">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
              No Image
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="font-semibold text-white line-clamp-2">{p.title}</p>

          <div className="mt-2">
            <StarRow />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-bold text-pink-400">৳ {p.price}</p>

            <button
              onClick={() => addItem({ id: p.id, name: p.title, price: p.price })}
              className="px-4 py-2 rounded-lg border border-zinc-700 bg-black hover:bg-zinc-900 text-sm"
              type="button"
            >
              Add To Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black">
      {/* Top spacing row: hamburger + hero + viewing trending */}
      <div className="max-w-6xl mx-auto px-6 pt-10">
        <div className="grid grid-cols-12 items-start gap-6">
          {/* Hamburger */}
          <div className="col-span-12 md:col-span-2 flex items-center">
            <button
              onClick={() => setDrawerOpen(true)}
              className="h-11 w-11 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center"
              type="button"
              aria-label="Open categories"
              title="Categories"
            >
              <MenuIcon />
            </button>
          </div>

          {/* Hero middle */}
          <div className="col-span-12 md:col-span-8">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
              <p className="text-sm text-gray-300">Welcome</p>

              <div className="mt-2 flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold">
                  Amr Cosmetics{" "}
                  <span className="text-pink-500">Store</span>
                </h1>
              </div>

              <p className="mt-4 text-gray-300 text-sm md:text-base">
                Beauty that belongs to you
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="bg-pink-500 hover:bg-pink-600 px-6 py-3 rounded-xl font-semibold"
                >
                  Shop Products
                </Link>

                <Link
                  href="/account/coupons"
                  className="border border-zinc-700 hover:border-pink-500 px-6 py-3 rounded-xl font-semibold"
                >
                  My Coupons
                </Link>

                <Link
                  href="/cart"
                  className="border border-zinc-700 hover:border-pink-500 px-6 py-3 rounded-xl font-semibold"
                >
                  Cart
                </Link>
              </div>
            </div>
          </div>

          {/* Viewing trending */}
          <div className="col-span-12 md:col-span-2 flex md:justify-end">
            <div className="text-sm text-gray-300 mt-1">
              {selectedCategory === "All" ? (
                <span className="text-gray-200">Viewing Trending</span>
              ) : (
                <span className="text-gray-200">Category: {selectedCategory}</span>
              )}
            </div>
          </div>
        </div>

        {/* Trending OR Category products */}
        <div className="mt-10 pb-16">
          {selectedCategory === "All" ? (
            <>
              <div className="flex items-end justify-between">
                <h2 className="text-xl font-bold text-white">Trending</h2>
                <p className="text-xs text-gray-400">Auto update every 5 seconds</p>
              </div>

              {trending3.length === 0 ? (
                <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-gray-300">
                  এখনো কোনো product নেই। Admin থেকে product add করলে এখানে দেখাবে।
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <ProductCard p={trending3[0]} />
                  {trending3[1] && <ProductCard p={trending3[1]} emphasis />}
                  {trending3[2] && <ProductCard p={trending3[2]} />}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-end justify-between">
                <h2 className="text-xl font-bold text-white">{selectedCategory}</h2>
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="text-sm text-pink-400 hover:text-pink-300"
                  type="button"
                >
                  Back to Trending
                </button>
              </div>

              {categoryProducts.length === 0 ? (
                <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-gray-300">
                  এই category তে এখনো কোনো product নেই।
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {categoryProducts.map((p) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
            type="button"
            aria-label="Close drawer"
          />

          <div className="absolute left-0 top-0 h-full w-[320px] bg-zinc-950 border-r border-zinc-800 p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">Categories</p>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-gray-300 hover:text-white"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handlePickCategory(cat)}
                  className={[
                    "w-full text-left px-4 py-3 rounded-xl border border-zinc-800",
                    "bg-zinc-900/40 hover:bg-zinc-900",
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? "border-pink-500"
                      : "",
                  ].join(" ")}
                  type="button"
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-zinc-800 pt-4">
              <Link
                href="/account/spin"
                className="block w-full text-center px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-gray-100"
                onClick={() => setDrawerOpen(false)}
              >
                Spin to Win
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
