import "./globals.css";
import Navbar from "./components/Navbar";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

export const metadata = {
  title: "Amr Cosmetics",
  description: "Beauty that belongs to you",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black flex flex-col">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
            <footer className="text-center py-4 text-gray-400 border-t border-zinc-900">
              © 2025 Amr Cosmetics
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
