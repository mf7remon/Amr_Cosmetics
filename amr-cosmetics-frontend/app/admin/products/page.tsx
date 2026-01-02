"use client";

import { useEffect, useMemo, useState } from "react";
import { Product, safeReadProducts, safeWriteProducts, slugify } from "@/app/lib/productsStore";

type FormState = {
  title: string;
  price: string;
  imageUrl: string;
  description: string;
};

const emptyForm: FormState = {
  title: "",
  price: "",
  imageUrl: "",
  description: "",
};

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(safeReadProducts());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    safeWriteProducts(items);
    window.dispatchEvent(new Event("amr-products-updated"));
  }, [items, hydrated]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => b.createdAt - a.createdAt);
  }, [items]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = () => {
    setStatus("");

    const title = form.title.trim();
    const priceNum = Number(form.price);

    if (!title) {
      setStatus("Title required");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setStatus("Valid price required");
      return;
    }

    const slug = slugify(title);

    if (!editingId) {
      const newItem: Product = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        title,
        slug,
        price: priceNum,
        imageUrl: form.imageUrl.trim() || undefined,
        description: form.description.trim() || undefined,
        createdAt: Date.now(),
      };

      setItems((prev) => [newItem, ...prev]);
      resetForm();
      setStatus("✅ Product added");
      return;
    }

    setItems((prev) =>
      prev.map((p) =>
        p.id === editingId
          ? {
              ...p,
              title,
              slug,
              price: priceNum,
              imageUrl: form.imageUrl.trim() || undefined,
              description: form.description.trim() || undefined,
            }
          : p
      )
    );

    resetForm();
    setStatus("✅ Product updated");
  };

  const onEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      price: String(p.price),
      imageUrl: p.imageUrl ?? "",
      description: p.description ?? "",
    });
    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    setStatus("✅ Product deleted");
  };

  const clearAll = () => {
    setItems([]);
    resetForm();
    setStatus("✅ Cleared all products");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-pink-500">Admin • Products</h1>
          <p className="text-gray-400 mt-1">Demo CRUD (localStorage). Later we connect backend + DB.</p>
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
        <div className="border border-zinc-800 bg-zinc-900 rounded p-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Product" : "Add New Product"}</h2>

          <label className="block text-sm text-gray-300 mb-1">Title</label>
          <input
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
          />

          <label className="block text-sm text-gray-300 mb-1">Price (৳)</label>
          <input
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.price}
            onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
            inputMode="numeric"
          />

          <label className="block text-sm text-gray-300 mb-1">Image URL (optional)</label>
          <input
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.imageUrl}
            onChange={(e) => setForm((s) => ({ ...s, imageUrl: e.target.value }))}
          />

          <label className="block text-sm text-gray-300 mb-1">Description (optional)</label>
          <textarea
            className="w-full mb-6 px-3 py-2 rounded bg-zinc-800 text-white outline-none min-h-[120px]"
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
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

          <p className="text-xs text-gray-400 mt-4">
            Slug auto তৈরি হবে title থেকে (e.g. “Matte Lipstick” → matte-lipstick)
          </p>
        </div>

        <div className="border border-zinc-800 bg-zinc-900 rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Products ({sorted.length})</h2>

          {sorted.length === 0 ? (
            <p className="text-gray-400">No products yet.</p>
          ) : (
            <div className="space-y-4">
              {sorted.map((p) => (
                <div key={p.id} className="border border-zinc-800 rounded p-4 bg-zinc-950">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{p.title}</h3>
                      <p className="text-sm text-gray-400">Slug: {p.slug}</p>
                      <p className="text-pink-400 mt-2">৳ {p.price}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {p.description ? <p className="text-gray-300 mt-3">{p.description}</p> : null}
                  {p.imageUrl ? <p className="text-gray-400 mt-3 break-all">Image: {p.imageUrl}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
