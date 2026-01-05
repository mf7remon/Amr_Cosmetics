"use client";

type Props = {
  open: boolean;
  categories: string[];
  active: string;
  onClose: () => void;
  onSelect: (category: string) => void;
};

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
            ? "fixed top-0 left-0 z-50 h-full w-[280px] bg-zinc-950 border-r border-zinc-800 transform translate-x-0 transition-transform duration-300"
            : "fixed top-0 left-0 z-50 h-full w-[280px] bg-zinc-950 border-r border-zinc-800 transform -translate-x-full transition-transform duration-300"
        }
      >
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Browse</p>
            <p className="text-white font-semibold">Categories</p>
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

        <div className="p-5 space-y-2">
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
                    ? "w-full text-left px-4 py-2 rounded bg-pink-600 text-white"
                    : "w-full text-left px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-gray-200 hover:border-pink-500"
                }
              >
                {c}
              </button>
            );
          })}
        </div>

        <div className="p-5 text-xs text-gray-500 border-t border-zinc-800">
          Tip: Category select করলে উপরে Trending ছোট হয়ে যাবে, নিচে category products আসবে
        </div>
      </aside>
    </>
  );
}
