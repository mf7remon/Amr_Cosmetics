"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BlogPost,
  createBlogSlug,
  ensureUniqueSlug,
  estimateReadTime,
  safeReadBlogs,
  safeWriteBlogs,
  BLOGS_KEY,
} from "@/app/lib/blogsStore";

import { Product, safeReadProducts } from "@/app/lib/productsStore";

type FormState = {
  title: string;
  category: string;
  coverImage: string;
  excerpt: string;
  content: string;
};

const emptyForm: FormState = {
  title: "",
  category: "Beauty care",
  coverImage: "/logo.png",
  excerpt: "",
  content: "",
};

// ✅ fallback defaults
const DEFAULT_CATEGORIES = [
  "Beauty care",
  "Gift",
  "Lifestyle",
  "Jewellery",
  "Tech Accessories",
  "Footware",
  "Bags",
  "Clothing",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminBlogsPage() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  // ✅ Load blogs + sync
  useEffect(() => {
    const load = () => setItems(safeReadBlogs());
    load();

    const onStorage = (e: StorageEvent) => {
      if (e.key === BLOGS_KEY) load();
    };

    const onCustom = () => load();

    window.addEventListener("storage", onStorage);
    window.addEventListener("amr-blogs-updated", onCustom as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("amr-blogs-updated", onCustom as any);
    };
  }, []);

  // ✅ Load products for category list + sync
  useEffect(() => {
    const load = () => setProducts(safeReadProducts());
    load();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "amr_products") load();
    };
    const onCustom = () => load();

    window.addEventListener("storage", onStorage);
    window.addEventListener("amr-products-updated", onCustom as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("amr-products-updated", onCustom as any);
    };
  }, []);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return copy;
  }, [items]);

  // ✅ FINAL dynamic category list = defaults + product categories + existing blog categories
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();

    // defaults
    for (const c of DEFAULT_CATEGORIES) set.add(c);

    // from products
    for (const p of products) {
      const c = (p.category ?? "").trim();
      if (c) set.add(c);
    }

    // from existing blogs
    for (const b of items) {
      const c = (b.category ?? "").trim();
      if (c) set.add(c);
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products, items]);

  // ✅ ensure form.category is not blank
  useEffect(() => {
    if (!form.category?.trim()) {
      setForm((s) => ({ ...s, category: categoryOptions[0] ?? "Beauty care" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryOptions.join("|")]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function commit(next: BlogPost[], msg?: string) {
    setItems(next);
    safeWriteBlogs(next);
    if (msg) setStatus(msg);
  }

  function submit() {
    setStatus("");

    const title = form.title.trim();
    const category = form.category.trim() || "Blog";
    const coverImage = (form.coverImage.trim() || "/logo.png").trim();
    const excerpt = form.excerpt.trim();
    const content = form.content.trim();

    if (!title) return setStatus("Title required");
    if (!excerpt) return setStatus("Excerpt required");
    if (!content) return setStatus("Content required");

    const baseSlug = createBlogSlug(title);

    if (!editingId) {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      const slug = ensureUniqueSlug(items, baseSlug, null);
      const now = Date.now();

      const newItem: BlogPost = {
        id,
        title,
        slug,
        excerpt,
        coverImage,
        category,
        dateISO: todayISO(),
        readTime: estimateReadTime(`${excerpt}\n\n${content}`),
        content,
        createdAt: now,
        updatedAt: now,
      };

      commit([newItem, ...items], "✅ Blog added");
      resetForm();
      return;
    }

    const next = items.map((b) => {
      if (b.id !== editingId) return b;

      const nextSlug = ensureUniqueSlug(items, baseSlug, editingId);

      return {
        ...b,
        title,
        slug: nextSlug,
        excerpt,
        coverImage,
        category,
        readTime: estimateReadTime(`${excerpt}\n\n${content}`),
        content,
        updatedAt: Date.now(),
      };
    });

    commit(next, "✅ Blog updated");
    resetForm();
  }

  function onEdit(b: BlogPost) {
    setEditingId(b.id);
    setForm({
      title: b.title,
      category: b.category,
      coverImage: b.coverImage || "/logo.png",
      excerpt: b.excerpt,
      content: b.content,
    });
    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onDelete(id: string) {
    const next = items.filter((b) => b.id !== id);
    commit(next, "✅ Blog deleted");
  }

  function clearAll() {
    commit([], "✅ Cleared all blogs");
    resetForm();
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-pink-500">Admin • Blogs</h1>
          <p className="text-gray-400 mt-1">Blog management</p>
          {status ? <p className="text-sm mt-2 text-pink-400">{status}</p> : null}
        </div>

        <button
          type="button"
          onClick={clearAll}
          className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FORM */}
        <div className="border border-zinc-800 bg-zinc-900 rounded p-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Blog" : "Add New Blog"}</h2>

          <label className="block text-sm text-gray-300 mb-1">Title</label>
          <input
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
          />

          <label className="block text-sm text-gray-300 mb-1">Category</label>
          <select
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.category}
            onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
          >
            {/* if editing an old blog category not in list, still show it */}
            {!categoryOptions.includes(form.category) ? (
              <option value={form.category}>{form.category}</option>
            ) : null}

            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label className="block text-sm text-gray-300 mb-1">Cover Image URL (or /path)</label>
          <input
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.coverImage}
            onChange={(e) => setForm((s) => ({ ...s, coverImage: e.target.value }))}
          />

          <label className="block text-sm text-gray-300 mb-1">Excerpt (short)</label>
          <textarea
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none min-h-[90px]"
            value={form.excerpt}
            onChange={(e) => setForm((s) => ({ ...s, excerpt: e.target.value }))}
          />

          <label className="block text-sm text-gray-300 mb-1">Content (full)</label>
          <textarea
            className="w-full mb-6 px-3 py-2 rounded bg-zinc-800 text-white outline-none min-h-[180px]"
            value={form.content}
            onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
            placeholder={"Write full blog content here.\n\nUse blank line to separate paragraphs."}
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={submit}
              className="bg-pink-600 px-6 py-2 rounded text-white hover:opacity-90"
            >
              {editingId ? "Save" : "Add"}
            </button>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="border border-zinc-700 px-6 py-2 rounded hover:border-pink-500"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>

        {/* LIST */}
        <div className="border border-zinc-800 bg-zinc-900 rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Blogs ({sorted.length})</h2>

          {sorted.length === 0 ? (
            <p className="text-gray-400">No blogs yet.</p>
          ) : (
            <div className="space-y-4">
              {sorted.map((b) => (
                <div key={b.id} className="border border-zinc-800 rounded p-4 bg-zinc-950">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg line-clamp-2">{b.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">Slug: {b.slug}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {b.category} • {b.dateISO} • {b.readTime}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(b)}
                        className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(b.id)}
                        className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {b.coverImage ? (
                    <p className="text-gray-400 mt-3 break-all text-xs">Cover: {b.coverImage}</p>
                  ) : null}

                  {b.excerpt ? <p className="text-gray-300 mt-3 text-sm">{b.excerpt}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
