"use client";

import Link from "next/link";

type Props = {
  open: boolean;
  categories: string[];
  active: string;
  onClose: () => void;
  onSelect: (category: string) => void;
};

function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l1.5 6.2L20 9l-6.5 1.2L12 16l-1.5-5.8L4 9l6.5-.8L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M5 15l.8 3L9 19l-3.2.7L5 23l-.8-3L1 19l3.2-.7L5 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomeCategoryDrawer({
  open,
  categories,
  active,
  onClose,
  onSelect,
}: Props) {
  return (
    <>
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className={
          open
            ? "fixed inset-0 z-40 bg-black/60"
            : "pointer-events-none fixed inset-0 z-40 bg-black/0"
        }
      />

      {/* Drawer */}
      <aside
        className={
          open
            ? "fixed top-0 left-0 z-50 h-full w-[290px] bg-zinc-950 border-r border-zinc-800 transform translate-x-0 transition-transform duration-300"
            : "fixed top-0 left-0 z-50 h-full w-[290px] bg-zinc-950 border-r border-zinc-800 transform -translate-x-full transition-transform duration-300"
        }
      >
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Menu</p>
            <p className="text-white font-semibold">Explore</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded bg-zinc-900 border border-zinc-800 hover:border-pink-500 flex items-center justify-center"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Spin (top item) */}
        <div className="p-5 border-b border-zinc-800">
          <Link
            href="/account/spin"
            onClick={onClose}
            className="w-full inline-flex items-center justify-between px-4 py-3 rounded bg-pink-600 text-white hover:opacity-90"
          >
            <span className="font-semibold text-sm">Spin to Win</span>
            <span className="inline-flex items-center gap-2 text-sm">
              <SparkIcon />
            </span>
          </Link>

          <p className="mt-3 text-xs text-gray-500">
            Spin button footer এ থাকবে না, drawer এর ভেতরেই থাকবে
          </p>
        </div>

        {/* Categories */}
        <div className="p-5">
          <p className="text-xs text-gray-500 mb-3">Categories</p>

          <div className="space-y-2">
            {categories.map((c) => {
              const isActive = c === active;

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onSelect(c);
                    onClose();
                  }}
                  className={
                    isActive
                      ? "w-full text-left px-4 py-2 rounded bg-zinc-900 border border-pink-500 text-white"
                      : "w-full text-left px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-gray-200 hover:border-pink-500"
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
