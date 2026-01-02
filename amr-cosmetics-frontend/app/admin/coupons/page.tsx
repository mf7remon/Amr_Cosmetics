"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { safeReadAdminCoupons, safeWriteAdminCoupons, type AdminCoupon, type AdminCouponType } from "@/app/lib/couponsStore";

type FormState = {
  title: string;
  code: string;
  type: AdminCouponType;
  value: string;
  expiresAt: string; // yyyy-mm-dd
  active: boolean;
};

const emptyForm: FormState = {
  title: "",
  code: "",
  type: "PERCENT",
  value: "",
  expiresAt: "",
  active: true,
};

export default function AdminCouponsPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  const [items, setItems] = useState<AdminCoupon[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

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

  useEffect(() => {
    setItems(safeReadAdminCoupons().sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const activeCount = useMemo(() => {
    const now = Date.now();
    return items.filter((c) => c.active && c.expiresAt > now).length;
  }, [items]);

  const persist = (next: AdminCoupon[]) => {
    setItems(next);
    safeWriteAdminCoupons(next);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = () => {
    setStatus("");

    const title = form.title.trim();
    const code = form.code.trim().toUpperCase();
    const valueNum = Number(form.value);

    if (!title) return setStatus("Title required");
    if (!code) return setStatus("Code required");
    if (!Number.isFinite(valueNum) || valueNum <= 0) return setStatus("Valid value required");
    if (!form.expiresAt) return setStatus("Expiry date required");

    const expiresAt = new Date(`${form.expiresAt}T23:59:59`).getTime();

    if (!editingId) {
      const exists = items.some((c) => (c.code ?? "").toUpperCase() === code);
      if (exists) return setStatus("Coupon code already exists");

      const newItem: AdminCoupon = {
        id: crypto.randomUUID(),
        title,
        code,
        type: form.type,
        value: valueNum,
        active: form.active,
        expiresAt,
        createdAt: Date.now(),
      };

      persist([newItem, ...items]);
      resetForm();
      setStatus("✅ Coupon added");
      return;
    }

    const updated = items.map((c) =>
      c.id === editingId
        ? {
            ...c,
            title,
            code,
            type: form.type,
            value: valueNum,
            active: form.active,
            expiresAt,
          }
        : c
    );

    persist(updated);
    resetForm();
    setStatus("✅ Coupon updated");
  };

  const onEdit = (c: AdminCoupon) => {
    setEditingId(c.id);
    const d = new Date(c.expiresAt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    setForm({
      title: c.title,
      code: c.code,
      type: c.type,
      value: String(c.value),
      expiresAt: `${yyyy}-${mm}-${dd}`,
      active: c.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = (id: string) => {
    persist(items.filter((c) => c.id !== id));
    setStatus("✅ Coupon deleted");
  };

  const toggleActive = (id: string) => {
    const updated = items.map((c) => (c.id === id ? { ...c, active: !c.active } : c));
    persist(updated);
  };

  if (!isLoggedIn || user?.role !== "ADMIN") return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-pink-500">Admin • Coupons</h1>
          <p className="text-gray-400 mt-1">
            Active coupons: <span className="text-white font-semibold">{activeCount}</span>
          </p>
          {status ? <p className="text-sm mt-2 text-pink-400">{status}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-zinc-800 bg-zinc-900 rounded p-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Coupon" : "Add New Coupon"}</h2>

          <label className="block text-sm text-gray-300 mb-1">Title</label>
          <input
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
          />

          <label className="block text-sm text-gray-300 mb-1">Code</label>
          <input
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.code}
            onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
            placeholder="AMR10"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Type</label>
              <select
                className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
                value={form.type}
                onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as AdminCouponType }))}
              >
                <option value="PERCENT">Percent</option>
                <option value="FIXED">Fixed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Value</label>
              <input
                className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
                value={form.value}
                onChange={(e) => setForm((s) => ({ ...s, value: e.target.value }))}
                placeholder="10 or 100"
              />
            </div>
          </div>

          <label className="block text-sm text-gray-300 mb-1">Expiry Date</label>
          <input
            type="date"
            className="w-full mb-4 px-3 py-2 rounded bg-zinc-800 text-white outline-none"
            value={form.expiresAt}
            onChange={(e) => setForm((s) => ({ ...s, expiresAt: e.target.value }))}
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
        </div>

        <div className="border border-zinc-800 bg-zinc-900 rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Coupons ({items.length})</h2>

          {items.length === 0 ? (
            <p className="text-gray-400">No coupons yet.</p>
          ) : (
            <div className="space-y-4">
              {items.map((c) => (
                <div key={c.id} className="border border-zinc-800 rounded p-4 bg-zinc-950">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{c.title}</h3>
                      <p className="text-sm text-gray-400">Code: {c.code}</p>
                      <p className="text-sm text-gray-400">
                        Discount: {c.type === "PERCENT" ? `${c.value}%` : `৳ ${c.value}`}
                      </p>
                      <p className="text-sm text-gray-400">
                        Expires: {new Date(c.expiresAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm mt-2">
                        Status:{" "}
                        {c.active ? (
                          <span className="text-green-400 font-semibold">Active</span>
                        ) : (
                          <span className="text-red-400 font-semibold">Inactive</span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(c.id)}
                        className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                      >
                        {c.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        className="border border-zinc-700 px-4 py-2 rounded hover:border-pink-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            Spin and Checkout will use only active and unexpired coupons from here.
          </p>
        </div>
      </div>
    </div>
  );
}
