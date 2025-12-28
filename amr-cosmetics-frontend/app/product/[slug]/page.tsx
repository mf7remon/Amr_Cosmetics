"use client";

import { useCart } from "../../context/CartContext";

export default function ProductDetailsPage() {
  const { addItem } = useCart();

  const product = {
    id: "lipstick-001",
    name: "Lipstick",
    price: 499,
  };

  return (
    <div className="px-8 py-10 text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-80 bg-zinc-800 rounded flex items-center justify-center">
          <span className="text-gray-400">Product Image</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-pink-500">{product.name}</h1>
          <p className="text-pink-400 font-bold mt-2 text-xl">৳ {product.price}</p>

          <p className="mt-4 text-gray-300">
            This is a sample product description for Amr Cosmetics. Smooth finish, long lasting,
            and perfect for daily wear.
          </p>

          <button
            onClick={() => addItem({ id: product.id, name: product.name, price: product.price })}
            className="mt-6 bg-pink-500 hover:bg-pink-600 px-6 py-3 rounded"
          >
            Add to Cart
          </button>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-pink-500 mb-4">Reviews</h2>

        <div className="bg-zinc-900 p-4 rounded mb-4">
          <p className="font-semibold">User123</p>
          <p className="text-gray-300">Very nice quality! Loved it.</p>
        </div>

        <div className="bg-zinc-900 p-4 rounded">
          <p className="font-semibold">User456</p>
          <p className="text-gray-300">Color is beautiful. Worth the price.</p>
        </div>

        <div className="mt-6 bg-zinc-900 p-4 rounded">
          <h3 className="text-lg font-semibold mb-3 text-pink-500">Write a Review</h3>

          <label className="block text-sm text-gray-300 mb-1">Name</label>
          <input
            type="text"
            className="w-full mb-3 px-3 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
          />

          <label className="block text-sm text-gray-300 mb-1">Comment</label>
          <textarea
            rows={3}
            className="w-full mb-3 px-3 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
          />

          <button className="bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded">
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}
