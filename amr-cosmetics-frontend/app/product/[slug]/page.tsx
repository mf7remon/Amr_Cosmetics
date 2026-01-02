"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Product, safeReadProducts } from "@/app/lib/productsStore";
import { useCart } from "@/app/context/CartContext";

export default function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const { addItem } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProducts(safeReadProducts());
    setLoaded(true);

    const onProducts = () => setProducts(safeReadProducts());
    window.addEventListener("amr-products-updated", onProducts);
    return () => window.removeEventListener("amr-products-updated", onProducts);
  }, []);

  const product = useMemo(() => {
    return products.find((p) => p.slug === params.slug) ?? null;
  }, [products, params.slug]);

  if (!loaded) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 text-gray-300">
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-pink-500">Product not found</h1>
        <p className="text-gray-400 mt-2">This product does not exist in localStorage.</p>
        <Link href="/products" className="inline-block mt-5 text-pink-400 hover:text-pink-300">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden">
          <div className="h-[320px] bg-zinc-900 flex items-center justify-center text-gray-400">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>No Image</span>
            )}
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-6">
          {product.category ? <p className="text-sm text-gray-400">{product.category}</p> : null}

          <h1 className="text-3xl font-bold text-pink-500 mt-1">{product.title}</h1>
          <p className="text-xl font-bold text-pink-400 mt-3">৳ {product.price}</p>

          {product.description ? (
            <p className="text-gray-300 mt-4 leading-relaxed">{product.description}</p>
          ) : (
            <p className="text-gray-400 mt-4">No description provided.</p>
          )}

          <div className="mt-6 flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => addItem({ id: product.id, name: product.title, price: product.price })}
              className="bg-pink-600 hover:opacity-90 px-6 py-3 rounded font-semibold"
            >
              Add to Cart
            </button>

            <Link
              href="/cart"
              className="border border-zinc-700 hover:border-pink-500 px-6 py-3 rounded font-semibold"
            >
              Go to Cart
            </Link>

            <Link
              href="/products"
              className="text-pink-400 hover:text-pink-300 px-2 py-3"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
