"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  image?: string;
  description?: string;
};

// ✅ MUST match admin CRUD localStorage key
const PRODUCTS_KEY = "amr_products";

function safeReadProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Light validation to avoid crashing if stored data shape is wrong
    return parsed
      .map((p: unknown) => {
        if (!p || typeof p !== "object") return null;

        const obj = p as Record<string, unknown>;

        const id = typeof obj.id === "string" ? obj.id : "";
        const title = typeof obj.title === "string" ? obj.title : "";
        const slug = typeof obj.slug === "string" ? obj.slug : "";
        const price =
          typeof obj.price === "number"
            ? obj.price
            : typeof obj.price === "string"
            ? Number(obj.price)
            : NaN;

        const image = typeof obj.image === "string" ? obj.image : "";
        const description = typeof obj.description === "string" ? obj.description : "";

        if (!id || !title || !slug || Number.isNaN(price)) return null;

        return { id, title, slug, price, image, description } satisfies Product;
      })
      .filter((x): x is Product => x !== null);
  } catch {
    return [];
  }
}

function getSafeImage(url?: string): string {
  if (!url) return "";
  // if user pasted google search url, image won't work — keep it blank
  const lower = url.toLowerCase();
  const looksLikeImage =
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif");

  return looksLikeImage ? url : "";
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  // ✅ Load once on mount
  useEffect(() => {
    const next = safeReadProducts();
    setProducts(next);
    setLoaded(true);
  }, []);

  // ✅ Keep synced: storage event (other tabs) + custom event (same tab)
  useEffect(() => {
    const reload = () => setProducts(safeReadProducts());

    const onStorage = (e: StorageEvent) => {
      if (e.key === PRODUCTS_KEY) reload();
    };

    const onCustom = () => reload();

    window.addEventListener("storage", onStorage);
    window.addEventListener("amr-products-updated", onCustom);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("amr-products-updated", onCustom);
    };
  }, []);

  const list = useMemo(() => {
    // sort newest first (if your admin stores createdAt)
    const copy = [...products];
    copy.sort((a, b) => {
      const aTime = Number((a as unknown as { createdAt?: number }).createdAt ?? 0);
      const bTime = Number((b as unknown as { createdAt?: number }).createdAt ?? 0);
      return bTime - aTime;
    });
    return copy;
  }, [products]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-pink-500">Our Products</h1>

        <button
          type="button"
          className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
          onClick={() => setProducts(safeReadProducts())}
        >
          Refresh
        </button>
      </div>

      {!loaded ? (
        <p className="text-gray-400">Loading products...</p>
      ) : list.length === 0 ? (
        <div className="border border-zinc-800 rounded p-6 bg-zinc-950">
          <p className="text-gray-300 mb-2">No products found.</p>
          <p className="text-gray-500 text-sm">
            Add products from <span className="text-pink-400">Admin → Products</span>, then come back.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const img = getSafeImage(p.image);

            return (
              <div key={p.id} className="border border-zinc-800 bg-zinc-950 rounded-lg overflow-hidden">
                <div className="h-40 bg-zinc-900 flex items-center justify-center text-gray-400">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <span>Product Image</span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                  <p className="text-pink-500 font-semibold mt-1">৳ {p.price}</p>

                  {p.description ? (
                    <p className="text-gray-400 text-sm mt-2 line-clamp-2">{p.description}</p>
                  ) : null}

                  <div className="flex gap-3 mt-4">
                    <Link
                      href={`/product/${p.slug}`}
                      className="flex-1 text-center border border-pink-600 text-white px-4 py-2 rounded hover:bg-pink-600"
                    >
                      Details
                    </Link>

                    <Link
                      href="/cart"
                      className="flex-1 text-center bg-pink-600 text-white px-4 py-2 rounded hover:opacity-90"
                    >
                      Add to Cart
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-gray-600 text-xs mt-8">
        Using localStorage key: <span className="text-gray-400">{PRODUCTS_KEY}</span>
      </p>
    </div>
  );
}
