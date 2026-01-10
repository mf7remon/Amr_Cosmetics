/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/app/context/CartContext";
import { Product, safeReadProducts } from "@/app/lib/productsStore";
import { Banner, safeReadBanners, BANNERS_KEY } from "@/app/lib/bannersStore";
import { BlogPost, safeReadBlogs } from "@/app/lib/blogsStore";

const ROTATE_MS = 5000;
const BANNER_ROTATE_MS = 5000;

const FIXED_CATEGORIES = [
  "Clothing",
  "Bags",
  "Jewellery",
  "Beauty care",
  "Footware",
  "Gift",
  "Tech Accessories",
];

// ✅ Quick picks categories (চাইলেই এখানে add/remove করতে পারো)
const QUICK_PICK_CATS = ["K-Beauty", "J-Beauty", "Jewellery"];

function normalize(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function buildCategories(products: Product[]) {
  const set = new Set<string>();

  // fixed ones always
  for (const c of FIXED_CATEGORIES) set.add(c);

  // dynamic from products
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

// ✅ small shuffle helper (for Most Selling + Blogs random)
function shuffleCopy<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function SkeletonCardHome({ size }: { size: "sm" | "lg" }) {
  const h = size === "lg" ? "h-56" : "h-48";
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
      <div className={`w-full ${h} bg-zinc-900`} />
      <div className="p-4 space-y-3">
        <div className="h-3 w-24 bg-zinc-800 rounded" />
        <div className="h-4 w-3/4 bg-zinc-800 rounded" />
        <div className="h-4 w-1/2 bg-zinc-800 rounded" />
        <div className="h-9 w-full bg-zinc-900 rounded-xl border border-zinc-800" />
      </div>
    </div>
  );
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
  const titleSize = size === "lg" ? "text-[15px]" : "text-[13px]";
  const priceSize = size === "lg" ? "text-[15px]" : "text-[13px]";

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden hover:border-pink-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <Link href={`/product/${p.slug}`} className="block">
        <div className={`w-full ${h} bg-zinc-900`}>
          {img ? (
            <img src={img} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
              No Image
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        {p.category ? <p className="text-[11px] text-gray-400 mb-1">{p.category}</p> : null}

        <p className={`font-semibold text-white ${titleSize} line-clamp-1`}>{p.title}</p>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-1 text-pink-400 text-sm">
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
          </div>
          <p className={`text-pink-400 font-bold ${priceSize}`}>৳ {p.price}</p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="mt-4 w-full py-2 rounded-xl bg-black border border-zinc-800 hover:border-pink-500 text-sm transition active:scale-[0.99]"
        >
          Add To Cart
        </button>
      </div>
    </div>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  const img = (post.coverImage || "").trim();
  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden hover:border-pink-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 block"
    >
      <div className="h-40 bg-zinc-900">
        {img ? (
          <img src={img} alt={post.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
            No Image
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-[11px] text-gray-400">{post.category}</p>
        <p className="mt-1 font-semibold text-white line-clamp-1">{post.title}</p>
        <p className="mt-2 text-sm text-gray-400 line-clamp-2">{post.excerpt}</p>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{post.dateISO}</span>
          <span className="text-pink-400">{post.readTime}</span>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { addItem } = useCart();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  const [activeCat, setActiveCat] = useState<string>("All");

  const [trendIndex, setTrendIndex] = useState(0);

  // ✅ banners
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoaded, setBannersLoaded] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);

  // ✅ blogs
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [blogsLoaded, setBlogsLoaded] = useState(false);

  useEffect(() => {
    const load = () => {
      setProducts(safeReadProducts());
      setProductsLoaded(true);
    };

    setProductsLoaded(false);
    load();

    const onFocus = () => load();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "amr_products") load();
    };

    const onCustom = () => load();

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    window.addEventListener("amr-products-updated", onCustom as any);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("amr-products-updated", onCustom as any);
    };
  }, []);

  // ✅ load banners + sync
  useEffect(() => {
    const load = () => {
      setBanners(safeReadBanners());
      setBannersLoaded(true);
    };

    setBannersLoaded(false);
    load();

    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === BANNERS_KEY) load();
    };

    window.addEventListener("amr-banners-updated", onCustom as any);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("amr-banners-updated", onCustom as any);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // ✅ load blogs + sync
  useEffect(() => {
    const load = () => {
      setBlogs(safeReadBlogs());
      setBlogsLoaded(true);
    };

    setBlogsLoaded(false);
    load();

    const onCustom = () => load();
    window.addEventListener("amr-blogs-updated", onCustom as any);

    return () => {
      window.removeEventListener("amr-blogs-updated", onCustom as any);
    };
  }, []);

  const categories = useMemo(() => buildCategories(products), [products]);

  const trendingList = useMemo(() => pickTrending(products), [products]);

  const filteredProducts = useMemo(() => {
    if (activeCat === "All") return products;
    return products.filter((p) => normalize(p.category) === normalize(activeCat));
  }, [products, activeCat]);

  // ✅ banners (active only)
  const activeBanners = useMemo(() => {
    return [...banners]
      .filter((b) => b.active)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [banners]);

  // reset index when product list changes
  useEffect(() => {
    setTrendIndex(0);
  }, [trendingList.length]);

  // rotate only in All mode
  useEffect(() => {
    if (activeCat !== "All") return;
    if (trendingList.length <= 3) return;

    const t = window.setInterval(() => {
      setTrendIndex((x) => x + 1);
    }, ROTATE_MS);

    return () => window.clearInterval(t);
  }, [activeCat, trendingList.length]);

  // ✅ banner rotate
  useEffect(() => {
    setBannerIndex(0);
  }, [activeBanners.length]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;

    const id = window.setInterval(() => {
      setBannerIndex((x) => x + 1);
    }, BANNER_ROTATE_MS);

    return () => window.clearInterval(id);
  }, [activeBanners.length]);

  const currentBanner = useMemo(() => {
    if (activeBanners.length === 0) return null;
    return activeBanners[bannerIndex % activeBanners.length];
  }, [activeBanners, bannerIndex]);

  const triple = useMemo(() => {
    if (trendingList.length === 0) return [];
    const n = trendingList.length;
    const a = trendingList[trendIndex % n];
    const b = trendingList[(trendIndex + 1) % n];
    const c = trendingList[(trendIndex + 2) % n];
    return [a, b, c] as Product[];
  }, [trendingList, trendIndex]);

  // ✅ quick picks map
  const quickPicks = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const cat of QUICK_PICK_CATS) {
      map[cat] = products
        .filter((p) => normalize(p.category) === normalize(cat))
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        .slice(0, 4);
    }
    return map;
  }, [products]);

  // ✅ "Most Selling" (random list - not real selling logic)
  const mostSelling = useMemo(() => {
    if (!productsLoaded) return [];
    if (products.length === 0) return [];
    return shuffleCopy(products).slice(0, 6);
  }, [products, productsLoaded]);

  // ✅ blogs random 3
  const blog3 = useMemo(() => {
    if (!blogsLoaded) return [];
    if (blogs.length === 0) return [];
    return shuffleCopy(blogs).slice(0, 3);
  }, [blogs, blogsLoaded]);

  function handleAdd(p: Product) {
    addItem({ id: p.id, name: p.title, price: p.price });
  }

  function selectCategory(c: string) {
    setActiveCat(c);
    setDrawerOpen(false);
  }

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
            className="h-9 w-9 rounded bg-zinc-900 border border-zinc-800 hover:border-pink-500 transition"
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-10">
        {/* HERO */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8">
          <div className="flex items-start gap-5">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="h-11 w-11 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-pink-500 flex items-center justify-center shrink-0 transition"
              aria-label="Open categories"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="flex-1 min-w-0 relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 md:p-5">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-10 -left-10 h-44 w-44 rounded-full bg-pink-500/25 blur-3xl" />
                <div className="absolute -bottom-10 -right-10 h-52 w-52 rounded-full bg-pink-500/20 blur-3xl" />
              </div>

              <div className="relative">
                <p className="text-[11px] text-pink-400">Amr Cosmetics</p>
                <h1 className="text-2xl md:text-3xl font-bold mt-2">
                  Beauty that belongs to <span className="text-pink-500">you</span>
                </h1>
                <p className="text-sm text-gray-300 mt-3 max-w-2xl">
                  Premium beauty essentials and lifestyle picks, curated with care for everyday confidence.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BANNER */}
        {!bannersLoaded ? (
          <div className="mt-5">
            <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
              <div className="h-64 sm:h-72 md:h-80 bg-zinc-800 animate-pulse" />
            </div>
          </div>
        ) : currentBanner ? (
          <div className="mt-5">
            <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-10 -left-10 h-44 w-44 rounded-full bg-pink-500/25 blur-3xl" />
                <div className="absolute -bottom-10 -right-10 h-52 w-52 rounded-full bg-pink-500/20 blur-3xl" />
              </div>

              {currentBanner.linkUrl ? (
                <a href={currentBanner.linkUrl} className="block relative">
                  <div className="h-64 sm:h-72 md:h-80 bg-zinc-950/40">
                    <img
                      src={currentBanner.imageUrl}
                      alt={currentBanner.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </a>
              ) : (
                <div className="relative">
                  <div className="h-64 sm:h-72 md:h-80 bg-zinc-950/40">
                    <img
                      src={currentBanner.imageUrl}
                      alt={currentBanner.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* CONTENT */}
        {activeCat === "All" ? (
          <div className="mt-10">
            {/* Trending */}
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold">Trending</h2>
                <p className="text-sm text-gray-400 mt-1">Latest products from your store</p>
              </div>

              <Link href="/products" className="text-sm text-pink-400 hover:text-pink-300">
                View all →
              </Link>
            </div>

            {!productsLoaded ? (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <SkeletonCardHome size="sm" />
                <div className="md:-translate-y-2">
                  <SkeletonCardHome size="lg" />
                </div>
                <SkeletonCardHome size="sm" />
              </div>
            ) : triple.length === 0 ? (
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

            {/* ✅ Quick Picks by category */}
            <div className="mt-12">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Quick picks by category</h2>
                  <p className="text-sm text-gray-400 mt-1">Handy picks from selected categories</p>
                </div>
              </div>

              <div className="mt-6 space-y-10">
                {QUICK_PICK_CATS.map((cat) => {
                  const list = quickPicks[cat] ?? [];
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-white">{cat}</h3>

                        {/* ✅ More → goes to products page filtered by that category */}
                        <Link
                          href={`/products?cat=${encodeURIComponent(cat)}`}
                          className="text-sm text-pink-400 hover:text-pink-300"
                        >
                          More →
                        </Link>
                      </div>

                      {productsLoaded && list.length === 0 ? (
                        <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-gray-400">
                          এই category তে এখনো কোনো product নেই।
                        </div>
                      ) : !productsLoaded ? (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonCardHome key={i} size="sm" />
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          {list.map((p) => (
                            <ProductCardHome key={p.id} p={p} size="sm" onAdd={() => handleAdd(p)} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ✅ Most Selling Products (random) */}
            <div className="mt-12">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Most Selling Products</h2>
                  <p className="text-sm text-gray-400 mt-1">Random picks (demo)</p>
                </div>

                <Link href="/products" className="text-sm text-pink-400 hover:text-pink-300">
                  View all →
                </Link>
              </div>

              {!productsLoaded ? (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCardHome key={i} size="sm" />
                  ))}
                </div>
              ) : mostSelling.length === 0 ? (
                <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-gray-400">
                  এখনো কোনো product নেই।
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mostSelling.map((p) => (
                    <ProductCardHome key={p.id} p={p} size="sm" onAdd={() => handleAdd(p)} />
                  ))}
                </div>
              )}
            </div>

            {/* ✅ Blogs (random 3) */}
            <div className="mt-12">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Blogs</h2>
                  <p className="text-sm text-gray-400 mt-1">Latest reads from your store</p>
                </div>

                <Link href="/blogs" className="text-sm text-pink-400 hover:text-pink-300">
                  View all →
                </Link>
              </div>

              {!blogsLoaded ? (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
                  <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
                  <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
                </div>
              ) : blog3.length === 0 ? (
                <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-gray-400">
                  এখনো কোনো blog নেই, admin থেকে blog add করলে এখানে দেখাবে।
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {blog3.map((b) => (
                    <BlogCard key={b.id} post={b} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
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

            {!productsLoaded ? (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCardHome key={i} size="sm" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
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
//remon
