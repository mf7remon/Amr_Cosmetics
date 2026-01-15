"use client";

import { useEffect, useMemo, useState } from "react";
import { Product, safeReadProducts, safeWriteProducts, slugify } from "@/app/lib/productsStore";

type FormState = {
  title: string;
  price: string;
  stock: string; // ✅ NEW
  imageUrl: string;
  description: string;
  categoryChoice: string; // dropdown value
  customCategory: string; // if dropdown = "Custom"
};

const CATEGORY_OPTIONS = [
  "Clothing",
  "Bags",
  "Jewellery",
  "Beauty care",
  "Footware",
  "Gift",
  "Tech Accessories",
];

const emptyForm: FormState = {
  title: "",
  price: "",
  stock: "999", // ✅ default
  imageUrl: "",
  description: "",
  categoryChoice: "All",
  customCategory: "",
};

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const existing = safeReadProducts();
    setItems(existing);
  }, []);

  const saveAndSet = (updater: (prev: Product[]) => Product[]) => {
    setItems((prev) => {
      const next = updater(prev);
      safeWriteProducts(next);
      try {
        window.dispatchEvent(new Event("amr-products-updated"));
      } catch {}
      return next;
    });
  };

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => b.createdAt - a.createdAt);
  }, [items]);

  const adminCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of CATEGORY_OPTIONS) set.add(c);
    for (const p of items) {
      const cat = (p.category ?? "").trim();
      if (cat) set.add(cat);
    }
    return ["All", ...Array.from(set).sort()];
  }, [items]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = () => {
    setStatus("");

    const title = form.title.trim();
    const priceNum = Number(form.price);

    // ✅ stock parse
    const stockRaw = form.stock.trim();
    const stockNum =
      stockRaw === "" ? 999 : Number(stockRaw);
    const stockFinal = Number.isFinite(stockNum) ? Math.max(0, Math.floor(stockNum)) : NaN;

    if (!title) {
      setStatus("Title required");
      return;
    }

    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setStatus("Valid price required");
      return;
    }

    if (!Number.isFinite(stockFinal)) {
      setStatus("Valid stock required (0 or more)");
      return;
    }

    const slug = slugify(title);

    // ✅ category final
    let categoryFinal = "";
    if (form.categoryChoice === "All") {
      categoryFinal = "";
    } else if (form.categoryChoice === "Custom") {
      categoryFinal = form.customCategory.trim();
    } else {
      categoryFinal = form.categoryChoice.trim();
    }

    const categoryValue = categoryFinal ? categoryFinal : undefined;

    if (!editingId) {
      const newItem: Product = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        title,
        slug,
        price: priceNum,
        stock: stockFinal, // ✅ NEW
        imageUrl: form.imageUrl.trim() || undefined,
        description: form.description.trim() || undefined,
        category: categoryValue,
        createdAt: Date.now(),
      };

      saveAndSet((prev) => [newItem, ...prev]);
      resetForm();
      setStatus("✅ Product added");
      return;
    }

    saveAndSet((prev) =>
      prev.map((p) =>
        p.id === editingId
          ? {
              ...p,
              title,
              slug,
              price: priceNum,
              stock: stockFinal, // ✅ NEW
              imageUrl: form.imageUrl.trim() || undefined,
              description: form.description.trim() || undefined,
              category: categoryValue,
            }
          : p
      )
    );

    resetForm();
    setStatus("✅ Product updated");
  };

  const onEdit = (p: Product) => {
    setEditingId(p.id);

    const existingCat = (p.category ?? "").trim();
    const existsInOptions = existingCat && adminCategoryOptions.includes(existingCat);

    setForm({
      title: p.title,
      price: String(p.price),
      stock: String((p as any).stock ?? 999), // ✅ NEW
      imageUrl: p.imageUrl ?? "",
      description: p.description ?? "",
      categoryChoice: existingCat ? (existsInOptions ? existingCat : "Custom") : "All",
      customCategory: existingCat && !existsInOptions ? existingCat : "",
    });

    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = (id: string) => {
    saveAndSet((prev) => prev.filter((p) => p.id !== id));
    setStatus("✅ Product deleted");
  };

  const clearAll = () => {
    saveAndSet(() => []);
    resetForm();
    setStatus("✅ Cleared all products");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-pink-500">Admin • Products</h1>
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

          {/* ✅ STOCK */}
          <label className="block text-sm text-gray-300 mb-1">Stock (0 = out of stock)</label>
          <input
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.stock}
            onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))}
            inputMode="numeric"
          />

          {/* ✅ CATEGORY */}
          <label className="block text-sm text-gray-300 mb-1">Category</label>
          <select
            className="w-full mb-3 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.categoryChoice}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                categoryChoice: e.target.value,
                customCategory: e.target.value === "Custom" ? s.customCategory : "",
              }))
            }
          >
            <option value="All">All (default)</option>
            {adminCategoryOptions
              .filter((c) => c !== "All")
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            <option value="Custom">Custom (নিজে লিখবো)</option>
          </select>

          {form.categoryChoice === "Custom" ? (
            <input
              className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
              placeholder="Type category name..."
              value={form.customCategory}
              onChange={(e) => setForm((s) => ({ ...s, customCategory: e.target.value }))}
            />
          ) : (
            <div className="mb-4" />
          )}

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
        </div>

        {/* LIST */}
        <div className="border border-zinc-800 bg-zinc-900 rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Products ({sorted.length})</h2>

          {sorted.length === 0 ? (
            <p className="text-gray-400">No products yet.</p>
          ) : (
            <div className="space-y-4">
              {sorted.map((p) => {
                const s = (p as any).stock ?? 999;
                const isZero = Number(s) <= 0;

                return (
                  <div key={p.id} className="border border-zinc-800 rounded p-4 bg-zinc-950">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{p.title}</h3>
                        <p className="text-sm text-gray-400">Slug: {p.slug}</p>

                        {p.category ? (
                          <p className="text-sm text-gray-400 mt-1">Category: {p.category}</p>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">Category: (None)</p>
                        )}

                        <p className="text-pink-400 mt-2">৳ {p.price}</p>

                        {/* ✅ Stock shown here (admin only) */}
                        <p className={`text-sm mt-2 ${isZero ? "text-red-300" : "text-gray-300"}`}>
                          Stock: {s} {isZero ? "(Out of stock)" : ""}
                        </p>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
