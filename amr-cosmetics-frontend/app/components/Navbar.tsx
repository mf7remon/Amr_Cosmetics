"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";

type CartItemLike = { quantity?: number; qty?: number };

type CartContextLike = {
  totalItems?: number;
  cartItems?: CartItemLike[];
  items?: CartItemLike[];
};

function getTotalItems(cart: CartContextLike): number {
  if (typeof cart.totalItems === "number") return cart.totalItems;

  const list = Array.isArray(cart.cartItems)
    ? cart.cartItems
    : Array.isArray(cart.items)
    ? cart.items
    : [];

  return list.reduce((sum, it) => sum + (it.qty ?? it.quantity ?? 1), 0);
}

export default function Navbar() {
  const cart = useCart() as unknown as CartContextLike;
  const { user, isLoggedIn, logout } = useAuth();
  const totalItems = getTotalItems(cart);

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-black text-white border-b border-zinc-900">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Amr Cosmetics"
          width={140}
          height={56}
          className="h-10 w-auto object-contain"
          priority
        />
      </Link>

      <ul className="flex gap-6 items-center">
        <li>
          <Link className="hover:text-pink-400" href="/">
            Home
          </Link>
        </li>

        <li>
          <Link className="hover:text-pink-400" href="/products">
            Products
          </Link>
        </li>

        <li>
          <Link className="hover:text-pink-400" href="/blogs">
            Blogs
          </Link>
        </li>

        <li className="relative">
          <Link className="hover:text-pink-400" href="/cart">
            Cart
          </Link>

          {totalItems > 0 && (
            <span className="absolute -top-2 -right-3 text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          )}
        </li>

        {!isLoggedIn ? (
          <>
            <li>
              <Link className="hover:text-pink-400" href="/login">
                Login
              </Link>
            </li>
            <li>
              <Link className="hover:text-pink-400" href="/register">
                Register
              </Link>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link className="hover:text-pink-400" href="/account">
                Account
              </Link>
            </li>

            {user?.role === "ADMIN" && (
              <li>
                <Link className="hover:text-pink-400" href="/admin">
                  Admin
                </Link>
              </li>
            )}

            <li>
              <button className="hover:text-pink-400" onClick={logout} type="button">
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
