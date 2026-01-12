// app/components/Navbar.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";
import { Product, safeReadProducts } from "@/app/lib/productsStore";

function NavLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "relative text-sm font-medium transition-colors",
        active ? "text-white" : "text-gray-300 hover:text-white",
      ].join(" ")}
      aria-label={label}
    >
      {children ?? label}
      {active ? (
        <span className="absolute -bottom-2 left-0 h-[2px] w-full rounded bg-pink-500" />
      ) : null}
    </Link>
  );
}

function normalize(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function buildCategories(products: Product[]) {
  const set = new Set<string>();
  for (const p of products) {
    const c = (p.category ?? "").trim();
    if (c) set.add(c);
  }
  return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}

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

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isLoggedIn, logout } = useAuth();
  const { items } = useCart();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const cartCount = useMemo(() => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, it: any) => sum + (Number(it?.qty) || 0), 0);
  }, [items]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const onLogout = () => {
    logout();
    setMobileOpen(false);
    router.push("/");
  };

  // load products for drawer categories (mobile)
  useEffect(() => {
    const load = () => setProducts(safeReadProducts());
    load();

    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "amr_products") load();
    };

    window.addEventListener("amr-products-updated", onCustom as any);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("amr-products-updated", onCustom as any);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const categories = useMemo(() => buildCategories(products), [products]);

  // lock scroll when drawer open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const goTo = (href: string) => {
    setMobileOpen(false);
    router.push(href);
  };

  const goToCategory = (c: string) => {
    setMobileOpen(false);
    if (c === "All") router.push("/products");
    else router.push(`/products?cat=${encodeURIComponent(c)}`);
  };

  return (
    <header className="w-full border-b border-white/10 bg-black">
      {/* Mobile Drawer Overlay */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={() => setMobileOpen(false)}
        className={
          mobileOpen
            ? "fixed inset-0 z-40 bg-black/60 md:hidden"
            : "pointer-events-none fixed inset-0 z-40 bg-black/0 md:hidden"
        }
      />

      {/* Mobile Drawer */}
      <aside
        className={
          mobileOpen
            ? "fixed top-0 left-0 z-50 h-full w-[290px] bg-zinc-950 border-r border-zinc-800 transform translate-x-0 transition-transform duration-300 md:hidden"
            : "fixed top-0 left-0 z-50 h-full w-[290px] bg-zinc-950 border-r border-zinc-800 transform -translate-x-full transition-transform duration-300 md:hidden"
        }
      >
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Menu</p>
            <p className="text-white font-semibold">Explore</p>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
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
            onClick={() => setMobileOpen(false)}
            className="w-full inline-flex items-center justify-between px-4 py-3 rounded bg-pink-600 text-white hover:opacity-90"
          >
            <span className="font-semibold text-sm">Spin to Win</span>
            <span className="inline-flex items-center gap-2 text-sm">
              <SparkIcon />
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <div className="p-5 border-b border-zinc-800">
          <p className="text-xs text-gray-500 mb-3">Navigation</p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => goTo("/")}
              className="w-full text-left px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-gray-200 hover:border-pink-500"
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => goTo("/products")}
              className="w-full text-left px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-gray-200 hover:border-pink-500"
            >
              Products
            </button>

            <button
              type="button"
              onClick={() => goTo("/blogs")}
              className="w-full text-left px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-gray-200 hover:border-pink-500"
            >
              Blogs
            </button>

            <button
              type="button"
              onClick={() => goTo("/cart")}
              className="w-full text-left px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-gray-200 hover:border-pink-500 flex items-center justify-between"
            >
              <span>Cart</span>
              {cartCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1.5 text-xs font-bold text-black">
                  {cartCount}
                </span>
              ) : null}
            </button>

            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => goTo("/account")}
                className="w-full text-left px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-gray-200 hover:border-pink-500"
              >
                Account
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goTo("/login")}
                className="w-full text-left px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-gray-200 hover:border-pink-500"
              >
                Login
              </button>
            )}

            {user?.role === "ADMIN" ? (
              <button
                type="button"
                onClick={() => goTo("/admin")}
                className="w-full text-left px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-gray-200 hover:border-pink-500"
              >
                Admin
              </button>
            ) : null}

            {isLoggedIn ? (
              <button
                type="button"
                onClick={onLogout}
                className="w-full text-left px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-gray-200 hover:border-pink-500"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>

        {/* Categories */}
        <div className="p-5">
          <p className="text-xs text-gray-500 mb-3">Categories</p>

          <div className="space-y-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => goToCategory(c)}
                className="w-full text-left px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-gray-200 hover:border-pink-500"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile hamburger + Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger (only mobile) */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden h-11 w-11 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-pink-500 flex items-center justify-center shrink-0 transition"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="relative h-20 w-[190px] sm:w-[220px] shrink-0"
            aria-label="Amr Cosmetics Home"
          >
            <Image
              src="/logo.png"
              alt="Amr Cosmetics"
              fill
              priority
              sizes="(max-width: 640px) 190px, 220px"
              className="object-contain"
            />
          </Link>
        </div>

        {/* Desktop menu (unchanged, hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="/" label="Home" active={isActive("/")}>
            Home
          </NavLink>

          <NavLink href="/products" label="Products" active={isActive("/products")}>
            Products
          </NavLink>

          <NavLink href="/blogs" label="Blogs" active={isActive("/blogs")}>
            Blogs
          </NavLink>

          <NavLink href="/cart" label="Cart" active={isActive("/cart")}>
            <span className="inline-flex items-center gap-2">
              <span>Cart</span>
              <span className="relative inline-flex items-center">
                {cartCount > 0 ? (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1.5 text-xs font-bold text-black">
                    {cartCount}
                  </span>
                ) : null}
              </span>
            </span>
          </NavLink>

          {isLoggedIn ? (
            <NavLink href="/account" label="Account" active={isActive("/account")}>
              Account
            </NavLink>
          ) : (
            <NavLink href="/login" label="Login" active={isActive("/login")}>
              Login
            </NavLink>
          )}

          {user?.role === "ADMIN" ? (
            <NavLink href="/admin" label="Admin" active={isActive("/admin")}>
              Admin
            </NavLink>
          ) : null}

          {isLoggedIn ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Logout
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
