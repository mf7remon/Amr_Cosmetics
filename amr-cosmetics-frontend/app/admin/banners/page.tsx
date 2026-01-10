/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Banner, BANNERS_KEY, safeReadBanners, safeWriteBanners } from "@/app/lib/bannersStore";

type FormState = {
  title: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
};

const emptyForm: FormState = {
  title: "",
  imageUrl: "",
  linkUrl: "",
  active: true,
};

export default function AdminBannersPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  const [items, setItems] = useState<Banner[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  // ✅ admin guard (same style as your coupons page)
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (user?.role !== "ADMIN") {
      router.replace("/");
      return;
    }
  }, [isLoggedIn, user?.role, router]);

  // ✅ load + sync
  useEffect(() => {
    const load = () => setItems(safeReadBanners());

    load();

    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === BANNERS_KEY) load();
    };

    window.addEventListener("amr-banners-updated", onCustom as any);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("amr-banners-updated", onCustom as any);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return copy;
  }, [items]);

  const persist = (next: Banner[], msg?: string) => {
    setItems(next);
    safeWriteBanners(next);
    if (msg) setStatus(msg);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = () => {
    setStatus("");

    const title = form.title.trim() || "Banner";
    const imageUrl = form.imageUrl.trim();
    const linkUrl = form.linkUrl.trim();

    if (!imageUrl) return setStatus("Image URL required");

    const now = Date.now();

    if (!editingId) {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      const newItem: Banner = {
        id,
        title,
        imageUrl,
        linkUrl: linkUrl ? linkUrl : undefined,
        active: form.active,
        createdAt: now,
        updatedAt: now,
      };

      persist([newItem, ...items], "✅ Banner added");
      resetForm();
      return;
    }

    const updated = items.map((b) =>
      b.id === editingId
        ? {
            ...b,
            title,
            imageUrl,
            linkUrl: linkUrl ? linkUrl : undefined,
            active: form.active,
            updatedAt: now,
          }
        : b
    );

    persist(updated, "✅ Banner updated");
    resetForm();
  };

  const onEdit = (b: Banner) => {
    setEditingId(b.id);
    setForm({
      title: b.title ?? "",
      imageUrl: b.imageUrl ?? "",
      linkUrl: b.linkUrl ?? "",
      active: !!b.active,
    });
    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = (id: string) => {
    persist(items.filter((b) => b.id !== id), "✅ Banner deleted");
  };

  const toggleActive = (id: string) => {
    const next = items.map((b) => (b.id === id ? { ...b, active: !b.active, updatedAt: Date.now() } : b));
    persist(next);
  };

  const clearAll = () => {
    persist([], "✅ Cleared all banners");
    resetForm();
  };

  if (!isLoggedIn || user?.role !== "ADMIN") return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-pink-500">Admin • Banners</h1>
          <p className="text-gray-400 mt-1">Add/Edit/Delete banners (paste image URL like imgbb).</p>
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
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Banner" : "Add New Banner"}</h2>

          <label className="block text-sm text-gray-300 mb-1">Title</label>
          <input
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            placeholder="New Year Offer"
          />

          <label className="block text-sm text-gray-300 mb-1">Image URL</label>
          <input
            className="w-full mb-3 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.imageUrl}
            onChange={(e) => setForm((s) => ({ ...s, imageUrl: e.target.value }))}
            placeholder="https://i.ibb.co/.....jpg"
          />

          {/* ✅ preview */}
          {form.imageUrl.trim() ? (
            <div className="mb-4 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
              <div className="h-40 bg-zinc-900">
                <img
                  src={form.imageUrl.trim()}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          ) : (
            <div className="mb-4" />
          )}

          <label className="block text-sm text-gray-300 mb-1">Link URL (optional)</label>
          <input
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.linkUrl}
            onChange={(e) => setForm((s) => ({ ...s, linkUrl: e.target.value }))}
            placeholder="/products  or  https://facebook.com/..."
          />

          <label className="flex items-center gap-2 text-sm text-gray-300 mb-6">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
            />
            Active
          </label>

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
            Tip: imgbb থেকে direct image link copy করে এখানে paste করলেই হবে।
          </p>
        </div>

        {/* LIST */}
        <div className="border border-zinc-800 bg-zinc-900 rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Banners ({sorted.length})</h2>

          {sorted.length === 0 ? (
            <p className="text-gray-400">No banners yet.</p>
          ) : (
            <div className="space-y-4">
              {sorted.map((b) => (
                <div key={b.id} className="border border-zinc-800 rounded p-4 bg-zinc-950">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg line-clamp-1">{b.title}</h3>
                      <p className="text-xs text-gray-400 mt-1 break-all">{b.imageUrl}</p>
                      {b.linkUrl ? (
                        <p className="text-xs text-gray-400 mt-1 break-all">Link: {b.linkUrl}</p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Link: None</p>
                      )}

                      <p className="text-sm mt-2">
                        Status:{" "}
                        {b.active ? (
                          <span className="text-green-400 font-semibold">Active</span>
                        ) : (
                          <span className="text-red-400 font-semibold">Inactive</span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(b)}
                        className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(b.id)}
                        className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                      >
                        {b.active ? "Deactivate" : "Activate"}
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

                  {/* ✅ show image in list */}
                  {b.imageUrl ? (
                    <div className="mt-4 border border-zinc-800 rounded-2xl overflow-hidden">
                      <div className="h-36 bg-zinc-900">
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            Home page only Active banners দেখাবে এবং rotate করবে।
          </p>
        </div>
      </div>
    </div>
  );
}
