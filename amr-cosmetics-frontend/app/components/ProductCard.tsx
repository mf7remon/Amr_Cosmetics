"use client";

import Link from "next/link";
import { useState } from "react";
import { Product } from "@/app/lib/productsStore";
import { useCart } from "@/app/context/CartContext";

/* eslint-disable @next/next/no-img-element */

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const stockNum =
    typeof product.stock === "number" ? product.stock : Number(product.stock);
  const stock = Number.isFinite(stockNum) ? Math.max(0, Math.floor(stockNum)) : 999;
  const outOfStock = stock <= 0;

  const onAddToCart = () => {
    if (outOfStock) return;

    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  };

  const img = product.imageUrl?.trim();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow">
      {/* ✅ IMAGE AREA NOW CLICKABLE */}
      <Link
        href={`/product/${product.slug}`}
        className="block relative h-56 bg-zinc-950 overflow-hidden"
        aria-label={`Open details for ${product.title}`}
      >
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
              alt={product.title}
              className="relative z-10 h-full w-full object-contain p-3"
              loading="lazy"
            />
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}

        {/* ✅ stock badge on image */}
        <div className="absolute top-3 left-3 z-20">
          <span
            className={[
              "text-[11px] px-2 py-1 rounded-full border",
              outOfStock
                ? "bg-red-500/10 text-red-300 border-red-500/30"
                : "bg-green-500/10 text-green-300 border-green-500/30",
            ].join(" ")}
          >
            {outOfStock ? "Out of stock" : `In stock: ${stock}`}
          </span>
        </div>
      </Link>

      <div className="p-5">
        {product.category ? (
          <p className="text-xs text-gray-400 mb-1">{product.category}</p>
        ) : null}

        <h3 className="text-lg font-semibold text-white">{product.title}</h3>
        <p className="text-pink-400 font-bold mt-1">৳ {product.price}</p>

        <div className="mt-4 flex gap-3">
          <Link
            href={`/product/${product.slug}`}
            className="flex-1 text-center border border-pink-500 text-white py-2 rounded hover:bg-pink-600"
          >
            Details
          </Link>

          <button
            type="button"
            onClick={onAddToCart}
            disabled={outOfStock}
            className={
              outOfStock
                ? "flex-1 text-center bg-red-600 text-white py-2 rounded cursor-not-allowed"
                : added
                ? "flex-1 text-center bg-zinc-800 text-white py-2 rounded border border-zinc-700"
                : "flex-1 text-center bg-pink-600 text-white py-2 rounded hover:opacity-90"
            }
          >
            {outOfStock ? "Out of Stock" : added ? "Added ✅" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
