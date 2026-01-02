"use client";

import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { items, subtotal, removeItem, updateQty, clearCart } = useCart();

  return (
    <div className="w-full bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
        <h1 className="text-3xl font-bold text-pink-500 mb-6">Your Cart</h1>

        {items.length === 0 ? (
          <div className="bg-zinc-900 p-6 rounded">
            <p className="text-gray-300">Your cart is empty.</p>
            <Link href="/products" className="inline-block mt-4 text-pink-400 hover:text-pink-300">
              Go to Products →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-zinc-900 rounded p-4">
                  <div className="hidden sm:grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-1">
                      <div className="h-12 w-12 bg-zinc-800 rounded flex items-center justify-center text-gray-400">
                        IMG
                      </div>
                    </div>

                    <div className="col-span-5">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-400">৳ {item.price}</p>
                    </div>

                    <div className="col-span-3">
                      <div className="flex items-center justify-start gap-2">
                        <button
                          className="h-9 w-9 rounded bg-zinc-800 hover:bg-zinc-700"
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>

                        <input
                          value={item.qty}
                          onChange={(e) =>
                            updateQty(item.id, parseInt(e.target.value || "1", 10))
                          }
                          className="h-9 w-14 text-center rounded bg-zinc-800 text-white outline-none"
                        />

                        <button
                          className="h-9 w-9 rounded bg-zinc-800 hover:bg-zinc-700"
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="col-span-2 text-right">
                      <p className="font-semibold text-pink-400">৳ {item.price * item.qty}</p>
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        className="text-sm text-red-400 hover:text-red-300"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="sm:hidden space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-zinc-800 rounded flex items-center justify-center text-gray-400">
                        IMG
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-400">৳ {item.price}</p>
                      </div>
                      <button
                        className="text-sm text-red-400 hover:text-red-300"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          className="h-9 w-9 rounded bg-zinc-800 hover:bg-zinc-700"
                          onClick={() => updateQty(item.id, item.qty - 1)}
                        >
                          -
                        </button>

                        <input
                          value={item.qty}
                          onChange={(e) =>
                            updateQty(item.id, parseInt(e.target.value || "1", 10))
                          }
                          className="h-9 w-14 text-center rounded bg-zinc-800 text-white outline-none"
                        />

                        <button
                          className="h-9 w-9 rounded bg-zinc-800 hover:bg-zinc-700"
                          onClick={() => updateQty(item.id, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>

                      <p className="font-semibold text-pink-400">৳ {item.price * item.qty}</p>
                    </div>
                  </div>
                </div>
              ))}

              <button className="text-sm text-gray-300 hover:text-white underline" onClick={clearCart}>
                Clear cart
              </button>
            </div>

            <div className="bg-zinc-900 p-6 rounded lg:sticky lg:top-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>৳ {subtotal}</span>
              </div>

              <div className="flex justify-between text-gray-300 mt-2">
                <span>Shipping</span>
                <span>৳ 0</span>
              </div>

              <hr className="my-4 border-zinc-800" />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-pink-400">৳ {subtotal}</span>
              </div>

              <Link
                href="/checkout"
                className="mt-5 block w-full text-center bg-pink-500 hover:bg-pink-600 py-3 rounded"
              >
                Proceed to Checkout
              </Link>

              <Link href="/products" className="block text-center mt-3 text-pink-400 hover:text-pink-300">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
