"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = login(email, password);
    setMsg(res.message);

    if (res.ok) {
      if (email.trim().toLowerCase() === "admin@amr.com") router.push("/admin");
      else router.push("/account");
    }
  }

  return (
    <div className="w-full bg-black">
      <div className="max-w-md mx-auto px-4 py-12 text-white">
        <h1 className="text-3xl font-bold text-pink-500 mb-6">Login</h1>

        <form onSubmit={handleSubmit} className="bg-zinc-900 p-6 rounded space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
              type="email"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
              type="password"
            />
          </div>

          <button className="w-full bg-pink-500 hover:bg-pink-600 py-2 rounded">Login</button>

          {msg && <p className="text-sm text-gray-300">{msg}</p>}

          <div className="text-sm text-gray-400">
            <p>
              Demo Admin: <span className="text-gray-200">admin@amr.com / admin123</span>
            </p>
          </div>
        </form>

        <p className="mt-4 text-gray-300">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-pink-400 hover:text-pink-300">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
