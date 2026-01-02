"use client";

import Link from "next/link";
import { Product } from "@/app/lib/productsStore";
import { useCart } from "@/app/context/CartContext";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow">
      <div className="h-44 bg-zinc-800 flex items-center justify-center">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-gray-400">No Image</span>
        )}
      </div>

      <div className="p-5">
        {product.category ? <p className="text-xs text-gray-400 mb-1">{product.category}</p> : null}

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
            onClick={() => addItem({ id: product.id, name: product.title, price: product.price })}
            className="flex-1 text-center bg-pink-600 text-white py-2 rounded hover:opacity-90"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
