// app/components/Navbar.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useMemo } from "react";

import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";

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

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isLoggedIn, logout } = useAuth();
  const { items } = useCart();

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
    router.push("/");
  };

  return (
    <header className="w-full border-b border-white/10 bg-black">
      {/* Top bar */}
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo left */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Amr Cosmetics"
            width={220}
            height={80}
            priority
            className="h-14 w-auto object-contain"
          />
        </Link>

        {/* Right menu */}
        <nav className="flex items-center gap-6">
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
