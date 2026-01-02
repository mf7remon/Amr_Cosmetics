"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();

  if (!isLoggedIn) {
    return (
      <div className="w-full bg-black">
        <div className="max-w-3xl mx-auto px-4 py-12 text-white">
          <h1 className="text-3xl font-bold text-pink-500 mb-3">Account</h1>
          <p className="text-gray-300">You are not logged in.</p>
          <Link href="/login" className="inline-block mt-4 text-pink-400 hover:text-pink-300">
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black">
      <div className="max-w-3xl mx-auto px-4 py-12 text-white">
        <h1 className="text-3xl font-bold text-pink-500 mb-6">My Account</h1>

        <div className="bg-zinc-900 p-6 rounded space-y-2">
          <p className="text-gray-300">
            Name: <span className="text-white font-semibold">{user?.name}</span>
          </p>
          <p className="text-gray-300">
            Email: <span className="text-white font-semibold">{user?.email}</span>
          </p>
          <p className="text-gray-300">
            Role: <span className="text-white font-semibold">{user?.role}</span>
          </p>
        </div>

        <div className="mt-6 flex gap-3 flex-wrap">
          <Link href="/products" className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800">
            Continue Shopping
          </Link>

          <Link href="/cart" className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800">
            View Cart
          </Link>

          <Link href="/account/spin" className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800">
            Spin to Win
          </Link>

          <Link href="/account/coupons" className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800">
            My Coupons
          </Link>

          <button
            className="px-4 py-2 rounded bg-pink-500 hover:bg-pink-600"
            onClick={() => {
              logout();
              router.push("/");
            }}
            type="button"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
