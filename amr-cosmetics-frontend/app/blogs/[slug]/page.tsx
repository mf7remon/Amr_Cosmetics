/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  BlogPost,
  BLOGS_KEY,
  getBlogBySlug,
  safeReadBlogs,
  splitParagraphs,
} from "@/app/lib/blogsStore";

function formatDate(iso: string) {
  try {
    // ✅ safer parse for "YYYY-MM-DD" to avoid timezone edge cases
    return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function BlogDetailsPage() {
  const routeParams = useParams() as Record<string, string | string[] | undefined>;
  const slugParam = routeParams?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

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

  const blog = useMemo(() => {
    if (!slug) return null;
    return getBlogBySlug(blogs, slug);
  }, [blogs, slug]);

  if (!blog) {
    return (
      <div className="w-full bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl font-bold text-pink-500">Blog not found</h1>
          <p className="text-gray-400 mt-2">এই blog টা পাওয়া যাচ্ছে না অথবা remove করা হয়েছে</p>
          <Link href="/blogs" className="inline-block mt-6 text-pink-400 hover:text-pink-300">
            ← Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  const paragraphs = splitParagraphs(blog.content);

  const related = blogs
    .filter((b) => b.slug.toLowerCase() !== blog.slug.toLowerCase())
    .slice(0, 2);

  return (
    <div className="w-full bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/blogs" className="text-sm text-pink-400 hover:text-pink-300">
            ← Back to Blogs
          </Link>

          <Link href="/products" className="text-sm text-pink-400 hover:text-pink-300">
            Shop products →
          </Link>
        </div>

        <div className="mt-6 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="h-64 sm:h-72 md:h-80 bg-zinc-900 flex items-center justify-center">
            <img
              src={blog.coverImage || "/logo.png"}
              alt={blog.title}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] px-2 py-1 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/30">
                {blog.category}
              </span>
              <span className="text-xs text-gray-500">{formatDate(blog.dateISO)}</span>
              <span className="text-xs text-gray-500">{blog.readTime}</span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-white leading-snug">
              {blog.title}
            </h1>

            <p className="mt-3 text-gray-300 text-sm">{blog.excerpt}</p>

            <div className="mt-6 space-y-4 text-gray-200 leading-relaxed">
              {paragraphs.map((para, idx) => (
                <p key={idx} className="text-sm sm:text-[15px] text-gray-200">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>

        {related.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-lg font-semibold">More to read</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {related.map((b) => (
                <Link
                  key={b.id}
                  href={`/blogs/${b.slug}`}
                  className="block bg-zinc-950 border border-zinc-800 rounded-2xl p-5 hover:border-pink-500 transition"
                >
                  <p className="text-[11px] text-gray-400">{b.category}</p>
                  <p className="mt-2 text-[15px] font-semibold text-white line-clamp-2">{b.title}</p>
                  <p className="mt-2 text-sm text-gray-400 line-clamp-2">{b.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
