"use client";

import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { totalItems } = useCart();

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-black text-white">
      <Link href="/" className="text-2xl font-bold text-pink-500">
        Amr Cosmetics
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

        <li>
          <Link className="hover:text-pink-400" href="/login">
            Login
          </Link>
        </li>
      </ul>
    </nav>
  );
}
