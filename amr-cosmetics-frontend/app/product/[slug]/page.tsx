"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { Product, safeReadProducts } from "@/app/lib/productsStore";

function getSafeImage(url?: string): string {
  if (!url) return "";
  return url;
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();

  const slug = useMemo(() => {
    const raw = (params as { slug?: string | string[] })?.slug;
    return Array.isArray(raw) ? raw[0] : raw || "";
  }, [params]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setProducts(safeReadProducts());
    setLoaded(true);
  }, []);

  const product = useMemo(() => {
    if (!slug) return null;
    return products.find((p) => p.slug === slug) || null;
  }, [products, slug]);

  const onAddToCart = () => {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  };

  // ✅ Buy Now always consistent: add this product then go checkout
  const onBuyNow = () => {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
    });

    router.push("/checkout");
  };

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

          <Link
            href="/products"
            className="bg-pink-600 px-4 py-2 rounded text-white hover:opacity-90"
          >
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

        <Link
          href="/cart"
          className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
        >
          View Cart
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-zinc-800 bg-zinc-900 rounded-xl overflow-hidden">
          {/* ✅ ONLY UPDATED THIS IMAGE PART */}
          <div className="relative h-[360px] bg-zinc-800 overflow-hidden">
            {img ? (
              <>
                {/* blurred background */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-40"
                  loading="lazy"
                />

                {/* full image (no crop) */}
                <div className="relative h-full w-full flex items-center justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
          {product.category ? (
            <p className="text-sm text-gray-400">{product.category}</p>
          ) : null}

          <h1 className="text-3xl font-bold text-white mt-2">{product.title}</h1>
          <p className="text-pink-400 font-bold text-2xl mt-3">৳ {product.price}</p>

          {product.description ? (
            <p className="text-gray-300 mt-5 leading-relaxed">{product.description}</p>
          ) : (
            <p className="text-gray-400 mt-5">No description added.</p>
          )}

          <div className="mt-7 flex gap-3">
            <button
              type="button"
              onClick={onAddToCart}
              className={
                added
                  ? "flex-1 bg-zinc-800 text-white py-3 rounded border border-zinc-700"
                  : "flex-1 bg-pink-600 text-white py-3 rounded hover:opacity-90"
              }
            >
              {added ? "Added ✅" : "Add to Cart"}
            </button>

            <button
              type="button"
              onClick={onBuyNow}
              className="flex-1 text-center border border-pink-500 text-white py-3 rounded hover:bg-pink-600"
            >
              Buy Now
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Buy Now দিলে product auto cart এ add হবে, তারপর checkout এ যাবে।
          </p>
        </div>
      </div>
    </div>
  );
}
