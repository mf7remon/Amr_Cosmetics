"use client";

import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function ProductCard() {
  const { addItem } = useCart();

  const product = {
    id: "lipstick-001",
    name: "Lipstick",
    price: 499,
    slug: "lipstick",
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-4 text-white shadow hover:shadow-lg transition">
      <div className="h-40 bg-zinc-800 rounded mb-4 flex items-center justify-center">
        <span className="text-gray-400">Product Image</span>
      </div>

      <h3 className="text-lg font-semibold">{product.name}</h3>
      <p className="text-pink-400 font-bold mt-1">৳ {product.price}</p>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => addItem({ id: product.id, name: product.name, price: product.price })}
          className="w-full bg-pink-500 hover:bg-pink-600 py-2 rounded"
        >
          Add to Cart
        </button>

        <Link
          className="w-full text-center border border-pink-500 hover:bg-pink-500 py-2 rounded"
          href={`/product/${product.slug}`}
        >
          Details
        </Link>
      </div>
    </div>
  );
}
