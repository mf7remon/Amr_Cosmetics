"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BlogPost, safeReadBlogs, BLOGS_KEY } from "@/app/lib/blogsStore";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);

  useEffect(() => {
    const load = () => setBlogs(safeReadBlogs());
    load();

    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === BLOGS_KEY) load();
    };

    window.addEventListener("amr-blogs-updated", onCustom);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("amr-blogs-updated", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const posts = useMemo(() => {
    const copy = [...blogs];
    copy.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return copy;
  }, [blogs]);

  return (
    <div className="w-full bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-pink-500">Blogs</h1>
            <p className="text-sm text-gray-400 mt-2">
              Quick reads about beauty, lifestyle, and gifting.
            </p>
          </div>

          <Link href="/products" className="text-sm text-pink-400 hover:text-pink-300">
            Shop products →
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="mt-8 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-gray-400">
            No blogs yet. Admin panel থেকে blog add করলে এখানে দেখাবে।
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((b) => (
              <article
                key={b.id}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden hover:border-pink-500 transition"
              >
                <Link href={`/blogs/${b.slug}`} className="block">
                  <div className="h-56 bg-zinc-900 flex items-center justify-center">
                    <img
                      src={b.coverImage || "/logo.png"}
                      alt={b.title}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>

                </Link>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] px-2 py-1 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/30">
                      {b.category}
                    </span>
                    <span className="text-[11px] text-gray-400">{b.readTime}</span>
                  </div>

                  <Link href={`/blogs/${b.slug}`} className="block mt-3">
                    <h2 className="text-[15px] font-semibold text-white leading-snug line-clamp-2">
                      {b.title}
                    </h2>
                  </Link>

                  <p className="text-sm text-gray-400 mt-2 line-clamp-3">{b.excerpt}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatDate(b.dateISO)}</span>
                    <Link href={`/blogs/${b.slug}`} className="text-sm text-pink-400 hover:text-pink-300">
                      Read more →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 border border-zinc-800 bg-zinc-950 rounded-2xl p-6">
          <p className="text-sm text-gray-300">
            Blogs এখন admin panel থেকে manage করা যাবে, backend আসলে later API দিয়ে replace হবে।
          </p>
        </div>
      </div>
    </div>
  );
}
