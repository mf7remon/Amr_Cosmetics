"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = register(name, email, password);
    setMsg(res.message);
    if (res.ok) router.push("/account");
  }

  return (
    <div className="w-full bg-black">
      <div className="max-w-md mx-auto px-4 py-12 text-white">
        <h1 className="text-3xl font-bold text-pink-500 mb-6">Register</h1>

        <form onSubmit={handleSubmit} className="bg-zinc-900 p-6 rounded space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
              type="text"
            />
          </div>

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

          <button className="w-full bg-pink-500 hover:bg-pink-600 py-2 rounded">
            Create Account
          </button>

          {msg && <p className="text-sm text-gray-300">{msg}</p>}
        </form>

        <p className="mt-4 text-gray-300">
          Already have an account?{" "}
          <Link href="/login" className="text-pink-400 hover:text-pink-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
