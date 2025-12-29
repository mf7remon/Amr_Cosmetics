import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CouponProvider } from "./context/CouponContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white">
        <AuthProvider>
          <CartProvider>
            <CouponProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <footer className="text-center py-4 text-gray-400 border-t border-zinc-900">
                © 2025 Amr Cosmetics
              </footer>
            </CouponProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
