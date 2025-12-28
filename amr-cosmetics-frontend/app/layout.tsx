import "./globals.css";
import Navbar from "./components/Navbar";
import { CartProvider } from "./context/CartContext";

export const metadata = {
  title: "Amr Cosmetics",
  description: "Beauty that belongs to you",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Navbar />
          <main>{children}</main>
          <footer className="text-center py-4 text-gray-400">© 2025 Amr Cosmetics</footer>
        </CartProvider>
      </body>
    </html>
  );
}
