"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { Product, safeReadProducts } from "@/app/lib/productsStore";

function getSafeImage(url?: string): string {
  if (!url) return "";
  return url;
}

function normalize(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

/** ---------------- Reviews (localStorage demo) ---------------- */
type Review = {
  id: string;
  productId: string;
  userName: string;
  userEmail: string;
  rating: number; // 1-5
  text: string;
  createdAt: number;
};

const REVIEWS_KEY = "amr_product_reviews_v1";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function makeId(prefix = "REV") {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 10)
      : String(Math.random()).slice(2, 12);
  return `${prefix}-${rand}`.toUpperCase();
}

function readReviewsMap(): Record<string, Review[]> {
  if (typeof window === "undefined") return {};
  return safeJsonParse<Record<string, Review[]>>(window.localStorage.getItem(REVIEWS_KEY), {});
}

function writeReviewsMap(map: Record<string, Review[]>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event("amr-reviews-updated"));
  } catch {
    // ignore
  }
}

function StarsRow({ value }: { value: number }) {
  const v = Math.max(1, Math.min(5, Math.floor(value)));
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < v ? "text-pink-400" : "text-zinc-600"} aria-hidden="true">
          ★
        </span>
      ))}
      <span className="text-xs text-gray-400 ml-2">{v}/5</span>
    </div>
  );
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { user, isLoggedIn } = useAuth();

  const slug = useMemo(() => {
    const raw = (params as { slug?: string | string[] })?.slug;
    return Array.isArray(raw) ? raw[0] : raw || "";
  }, [params]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [added, setAdded] = useState(false);

  // Tabs
  const [tab, setTab] = useState<"DETAILS" | "REVIEWS">("DETAILS");

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  useEffect(() => {
    setProducts(safeReadProducts());
    setLoaded(true);
  }, []);

  const product = useMemo(() => {
    if (!slug) return null;
    return products.find((p) => p.slug === slug) || null;
  }, [products, slug]);

  // ✅ Stock / Availability (no quantity shown)
  const stock = useMemo(() => {
    if (!product) return 0;
    const raw = (product as any).stock;
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : 999;
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 999;
  }, [product]);

  const isOutOfStock = !!product && stock <= 0;

  // Load reviews for this product
  useEffect(() => {
    if (!product?.id) {
      setReviews([]);
      return;
    }

    const load = () => {
      const map = readReviewsMap();
      const list = Array.isArray(map[product.id]) ? map[product.id] : [];
      const cleaned = list
        .filter(Boolean)
        .map((r) => ({
          id: typeof r.id === "string" ? r.id : makeId("REV"),
          productId: typeof r.productId === "string" ? r.productId : product.id,
          userName: typeof r.userName === "string" ? r.userName : "User",
          userEmail: typeof r.userEmail === "string" ? r.userEmail : "guest",
          rating: Number.isFinite(Number(r.rating)) ? Math.max(1, Math.min(5, Number(r.rating))) : 5,
          text: typeof r.text === "string" ? r.text : "",
          createdAt: Number.isFinite(Number(r.createdAt)) ? Number(r.createdAt) : Date.now(),
        }))
        .filter((r) => r.text.trim().length > 0);

      cleaned.sort((a, b) => b.createdAt - a.createdAt);
      setReviews(cleaned);
    };

    load();

    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === REVIEWS_KEY) load();
    };

    window.addEventListener("amr-reviews-updated", onCustom as any);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("amr-reviews-updated", onCustom as any);
      window.removeEventListener("storage", onStorage);
    };
  }, [product?.id]);

  const onAddToCart = () => {
    if (!product) return;
    if (isOutOfStock) return;

    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  };

  // ✅ Buy Now: blocked if out of stock
  const onBuyNow = () => {
    if (!product) return;
    if (isOutOfStock) return;

    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
    });

    router.push("/checkout");
  };

  const canDeleteReview = (r: Review) => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    return normalize(user.email) === normalize(r.userEmail);
  };

  const onSubmitReview = () => {
    setReviewMsg(null);
    if (!product) return;

    if (!isLoggedIn || !user) {
      setReviewMsg("Please login to write a review.");
      return;
    }

    const text = reviewText.trim();
    if (!text) {
      setReviewMsg("Write something first.");
      return;
    }

    const safeRating = Math.max(1, Math.min(5, Math.floor(rating)));

    const next: Review = {
      id: makeId("REV"),
      productId: product.id,
      userName: user.name || "User",
      userEmail: user.email,
      rating: safeRating,
      text,
      createdAt: Date.now(),
    };

    const map = readReviewsMap();
    const list = Array.isArray(map[product.id]) ? map[product.id] : [];
    map[product.id] = [next, ...list];
    writeReviewsMap(map);

    setReviewText("");
    setRating(5);
    setReviewMsg("Review added ✅");
    setTab("REVIEWS");
  };

  const onDeleteReview = (reviewId: string) => {
    if (!product) return;
    const map = readReviewsMap();
    const list = Array.isArray(map[product.id]) ? map[product.id] : [];
    map[product.id] = list.filter((r) => r?.id !== reviewId);
    writeReviewsMap(map);
  };

  const recommended = useMemo(() => {
    if (!product) return [];
    const cat = normalize(product.category);
    const list =
      cat && cat !== "undefined"
        ? products.filter((p) => p.id !== product.id && normalize(p.category) === cat)
        : [];

    const sorted = [...list].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    if (sorted.length > 0) return sorted.slice(0, 8);

    const fallback = products
      .filter((p) => p.id !== product.id)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 8);

    return fallback;
  }, [products, product]);

  function RecCard({ p }: { p: Product }) {
    const img = p.imageUrl?.trim() ?? "";
    return (
      <Link
        href={`/product/${p.slug}`}
        className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-pink-500 transition"
      >
        <div className="relative h-40 bg-zinc-950 overflow-hidden">
          {img ? (
            <>
              <img
                src={img}
                alt=""
                className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-25 scale-110"
                aria-hidden="true"
              />
              <img
                src={img}
                alt={p.title}
                className="relative z-10 h-full w-full object-contain p-3"
                loading="lazy"
              />
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
              No Image
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-white font-semibold line-clamp-1">{p.title}</p>
          <p className="text-pink-400 font-bold mt-1">৳ {p.price}</p>
          {p.category ? <p className="text-xs text-gray-400 mt-1">{p.category}</p> : null}
        </div>
      </Link>
    );
  }

  if (!loaded) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-pink-500">Product not found</h1>
        <p className="text-gray-400 mt-2">এই product টা হয়তো delete হয়ে গেছে বা link ভুল।</p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
          >
            Go Back
          </button>

          <Link href="/products" className="bg-pink-600 px-4 py-2 rounded text-white hover:opacity-90">
            All Products
          </Link>
        </div>
      </div>
    );
  }

  const img = getSafeImage(product.imageUrl);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
        >
          ← Back
        </button>

        <Link href="/cart" className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500">
          View Cart
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-zinc-800 bg-zinc-900 rounded-xl overflow-hidden">
          <div className="relative h-[360px] bg-zinc-800 overflow-hidden">
            {img ? (
              <>
                <img
                  src={img}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-40"
                  loading="lazy"
                />

                <div className="relative h-full w-full flex items-center justify-center p-4">
                  <img
                    src={img}
                    alt={product.title}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-6">
          {product.category ? <p className="text-sm text-gray-400">{product.category}</p> : null}

          <h1 className="text-3xl font-bold text-white mt-2">{product.title}</h1>

          <div className="mt-3 flex items-center gap-3">
            <p className="text-pink-400 font-bold text-2xl">৳ {product.price}</p>

            {/* ✅ Availability badge (no quantity shown) */}
            {isOutOfStock ? (
              <span className="text-xs px-3 py-1 rounded-full border border-red-500/40 bg-red-500/15 text-red-300">
                Out of Stock
              </span>
            ) : (
              <span className="text-xs px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                Available
              </span>
            )}
          </div>

          <div className="mt-7 flex gap-3">
            <button
              type="button"
              onClick={onAddToCart}
              disabled={isOutOfStock}
              className={
                isOutOfStock
                  ? "flex-1 bg-red-600/80 text-white py-3 rounded border border-red-500/50 cursor-not-allowed"
                  : added
                  ? "flex-1 bg-zinc-800 text-white py-3 rounded border border-zinc-700"
                  : "flex-1 bg-pink-600 text-white py-3 rounded hover:opacity-90"
              }
            >
              {isOutOfStock ? "Out of Stock" : added ? "Added ✅" : "Add to Cart"}
            </button>

            <button
              type="button"
              onClick={onBuyNow}
              disabled={isOutOfStock}
              className={
                isOutOfStock
                  ? "flex-1 text-center border border-red-500/60 text-white py-3 rounded bg-red-500/10 cursor-not-allowed"
                  : "flex-1 text-center border border-pink-500 text-white py-3 rounded hover:bg-pink-600"
              }
            >
              Buy Now
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-zinc-800 flex items-center gap-6">
            <button
              type="button"
              onClick={() => setTab("DETAILS")}
              className={[
                "pb-3 text-sm font-semibold transition-colors",
                tab === "DETAILS"
                  ? "text-white border-b-2 border-pink-500"
                  : "text-gray-400 hover:text-white",
              ].join(" ")}
            >
              Details
            </button>

            <button
              type="button"
              onClick={() => setTab("REVIEWS")}
              className={[
                "pb-3 text-sm font-semibold transition-colors",
                tab === "REVIEWS"
                  ? "text-white border-b-2 border-pink-500"
                  : "text-gray-400 hover:text-white",
              ].join(" ")}
            >
              Reviews ({reviews.length})
            </button>
          </div>

          {/* Tab content */}
          {tab === "DETAILS" ? (
            <div className="mt-5">
              {product.description ? (
                <p className="text-gray-300 leading-relaxed">{product.description}</p>
              ) : (
                <p className="text-gray-400">No description added.</p>
              )}
            </div>
          ) : (
            <div className="mt-5">
              {/* Review form */}
              <div className="border border-zinc-800 bg-zinc-950/40 rounded-xl p-4">
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-white">Write a review</p>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const v = i + 1;
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setRating(v)}
                              className={v <= rating ? "text-pink-400" : "text-zinc-600"}
                              aria-label={`Rate ${v}`}
                              title={`Rate ${v}`}
                            >
                              ★
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={3}
                      className="mt-3 w-full rounded-lg bg-zinc-900 border border-zinc-800 text-white px-3 py-2 outline-none focus:border-pink-500"
                      placeholder="Write your review..."
                    />

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-400">
                        Posting as <span className="text-gray-200">{user?.name || "User"}</span>
                      </p>

                      <button
                        type="button"
                        onClick={onSubmitReview}
                        className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-semibold hover:opacity-90"
                      >
                        Post
                      </button>
                    </div>

                    {reviewMsg ? <p className="text-xs text-gray-300 mt-2">{reviewMsg}</p> : null}
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-300">Login করলে review দিতে পারবে।</p>
                    <Link
                      href="/login"
                      className="px-4 py-2 rounded-lg border border-pink-500 text-white text-sm hover:bg-pink-600"
                    >
                      Login
                    </Link>
                  </div>
                )}
              </div>

              {/* Reviews list */}
              <div className="mt-5 space-y-3">
                {reviews.length === 0 ? (
                  <div className="text-sm text-gray-400 border border-zinc-800 bg-zinc-950/40 rounded-xl p-4">
                    No reviews yet. Be the first to review!
                  </div>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="border border-zinc-800 bg-zinc-950/40 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{r.userName}</p>
                          <div className="mt-1">
                            <StarsRow value={r.rating} />
                          </div>
                        </div>

                        {canDeleteReview(r) ? (
                          <button
                            type="button"
                            onClick={() => onDeleteReview(r.id)}
                            className="text-xs px-3 py-1 rounded-full border border-zinc-700 hover:border-pink-500 text-gray-200"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>

                      <p className="text-sm text-gray-300 mt-3 whitespace-pre-wrap">{r.text}</p>

                      <p className="text-xs text-gray-500 mt-3">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommended */}
      <div className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Recommended for you</h2>
            <p className="text-sm text-gray-400 mt-1">
              {product.category ? `More from ${product.category}` : "Latest products you may like"}
            </p>
          </div>

          <Link href="/products" className="text-sm text-pink-400 hover:text-pink-300">
            View all →
          </Link>
        </div>

        {recommended.length === 0 ? (
          <div className="mt-5 border border-zinc-800 bg-zinc-900 rounded p-6 text-gray-300">
            No recommended products yet.
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommended.map((p) => (
              <RecCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
