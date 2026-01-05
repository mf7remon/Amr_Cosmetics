"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/app/lib/productsStore";

type Props = {
  products: Product[];
  title?: string;
  variant?: "large" | "compact";
  intervalMs?: number;
};

function pick3(list: Product[], start: number): Product[] {
  if (list.length === 0) return [];
  if (list.length <= 3) return list.slice(0, 3);

  const out: Product[] = [];
  for (let i = 0; i < 3; i++) {
    out.push(list[(start + i) % list.length]);
  }
  return out;
}

export default function TrendingShowcase({
  products,
  title = "Trending Now",
  variant = "large",
  intervalMs = 5000,
}: Props) {
  const [start, setStart] = useState(0);

  const show = useMemo(() => pick3(products, start), [products, start]);

  useEffect(() => {
    setStart(0);
  }, [products.length]);

  useEffect(() => {
    if (products.length <= 3) return;

    const id = window.setInterval(() => {
      setStart((s) => (s + 3) % products.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [products.length, intervalMs]);

  const wrapClass =
    variant === "large"
      ? "mt-10"
      : "mt-6";

  const cardBase =
    variant === "large"
      ? "rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900"
      : "rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900";

  const imgHeight =
    variant === "large" ? "h-48 sm:h-56" : "h-32 sm:h-36";

  const textPad =
    variant === "large" ? "p-5" : "p-4";

  const priceClass =
    variant === "large"
      ? "text-pink-400 font-bold text-lg"
      : "text-pink-400 font-semibold";

  return (
    <section className={wrapClass}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-sm text-gray-400">
          {products.length > 3 ? "Auto rotating" : "Latest products"}
        </p>
      </div>

      {show.length === 0 ? (
        <div className="mt-4 border border-zinc-800 bg-zinc-900 rounded p-6 text-gray-300">
          No products yet. Add products from Admin → Products.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {show.map((p, idx) => {
            const isMiddle = idx === 1;

            const middleScale =
              isMiddle
                ? variant === "large"
                  ? "md:scale-[1.06]"
                  : "md:scale-[1.03]"
                : "";

            const middleShadow = isMiddle ? "md:shadow-lg" : "";

            return (
              <Link
                key={`${p.id}-${idx}-${start}`}
                href={`/product/${p.slug}`}
                className={`${cardBase} ${middleScale} ${middleShadow} transition-transform duration-300`}
              >
                <div className={`${imgHeight} bg-zinc-800 flex items-center justify-center`}>
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-gray-400">No Image</span>
                  )}
                </div>

                <div className={textPad}>
                  {p.category ? (
                    <p className="text-xs text-gray-400 mb-1">{p.category}</p>
                  ) : null}

                  <h3 className="text-white font-semibold line-clamp-1">{p.title}</h3>

                  <div className="mt-2 flex items-center justify-between">
                    <span className={priceClass}>৳ {p.price}</span>
                    <span className="text-sm text-gray-300 border border-zinc-700 px-3 py-1 rounded-full bg-zinc-950">
                      View
                    </span>
                  </div>

                  {variant === "large" ? (
                    <p className="text-sm text-gray-400 mt-3 line-clamp-2">
                      {p.description ? p.description : "Tap to see full details and buy"}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
