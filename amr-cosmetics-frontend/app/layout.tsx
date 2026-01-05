import type { Metadata } from "next";
import "./globals.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CouponProvider } from "./context/CouponContext";

export const metadata: Metadata = {
  title: "Amr Cosmetics",
  description: "Womenhood-themed cosmetics store",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-black text-white">
        <AuthProvider>
          <CartProvider>
            <CouponProvider>
              <Navbar />
              <main className="flex-1 w-full">{children}</main>
              <Footer />
            </CouponProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
