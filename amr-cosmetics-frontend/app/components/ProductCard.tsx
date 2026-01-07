"use client";

import Link from "next/link";
import { useState } from "react";
import { Product } from "@/app/lib/productsStore";
import { useCart } from "@/app/context/CartContext";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const onAddToCart = () => {
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
      {/* Image area: full image (no crop) + blurred background for better look */}
      <div className="relative h-56 bg-zinc-950 overflow-hidden">
        {img ? (
          <>
            {/* blurred background layer */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt=""
              className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-25 scale-110"
              aria-hidden="true"
            />

            {/* main image (never cropped) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
      </div>

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
            className={
              added
                ? "flex-1 text-center bg-zinc-800 text-white py-2 rounded border border-zinc-700"
                : "flex-1 text-center bg-pink-600 text-white py-2 rounded hover:opacity-90"
            }
          >
            {added ? "Added ✅" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
