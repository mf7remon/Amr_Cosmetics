"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function ForgotPasswordPage() {
  const { requestPasswordResetOtp, resetPasswordWithOtp } = useAuth();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");

  const [stage, setStage] = useState<"OTP" | "RESET">("OTP");
  const [msg, setMsg] = useState<string | null>(null);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  function handleGetOtp(e: React.FormEvent) {
    e.preventDefault();
    const res = requestPasswordResetOtp(email);
    setMsg(res.message);
    if (res.ok) {
      setDemoOtp(res.otp ?? null);
      setStage("RESET");
    }
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    const res = resetPasswordWithOtp(email, otp, newPass);
    setMsg(res.message);
    if (res.ok) {
      setTimeout(() => {
        window.location.href = "/login";
      }, 300);
    }
  }

  return (
    <div className="w-full bg-black">
      <div className="max-w-md mx-auto px-4 py-12 text-white">
        <h1 className="text-3xl font-bold text-pink-500 mb-6">Forgot Password</h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
          {stage === "OTP" ? (
            <form onSubmit={handleGetOtp} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Your Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
                  type="email"
                />
              </div>

              <button className="w-full bg-pink-500 hover:bg-pink-600 py-2 rounded" type="submit">
                Get OTP (Demo)
              </button>

              {msg && <p className="text-sm text-gray-300">{msg}</p>}

              <p className="text-xs text-gray-400">
                Note: এটা demo, তাই OTP এখানে দেখানো হবে
              </p>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
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
                <label className="block text-sm text-gray-300 mb-1">OTP</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
                  inputMode="numeric"
                />
                {demoOtp ? (
                  <p className="text-xs text-gray-400 mt-2">
                    Demo OTP: <span className="text-gray-200">{demoOtp}</span>
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">New Password</label>
                <input
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
                  type="password"
                />
              </div>

              <button className="w-full bg-pink-500 hover:bg-pink-600 py-2 rounded" type="submit">
                Reset Password
              </button>

              {msg && <p className="text-sm text-gray-300">{msg}</p>}

              <button
                type="button"
                onClick={() => {
                  setStage("OTP");
                  setMsg(null);
                  setDemoOtp(null);
                  setOtp("");
                  setNewPass("");
                }}
                className="w-full border border-zinc-700 hover:border-pink-500 py-2 rounded"
              >
                Back
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 text-gray-300 text-sm">
          Back to{" "}
          <Link href="/login" className="text-pink-400 hover:text-pink-300">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
