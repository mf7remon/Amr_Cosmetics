import type { Metadata } from "next";
import "./globals.css";

import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { CouponProvider } from "./context/CouponContext";
import { CartProvider } from "./context/CartContext";

export const metadata: Metadata = {
  title: "Amr Cosmetics",
  description: "Womenhood-themed cosmetics store",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-black text-white">
        <AuthProvider>
          <CouponProvider>
            <CartProvider>
              <Navbar />
              <main className="flex-1 w-full">{children}</main>
              <footer className="text-center py-4 text-gray-400 border-t border-zinc-900">
                © 2025 Amr Cosmetics
              </footer>
            </CartProvider>
          </CouponProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
