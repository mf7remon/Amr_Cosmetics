import Link from "next/link";
import { SITE_CONFIG } from "@/app/lib/siteConfig";

function IconMail() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h16v12H4V6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M4 7l8 6 8-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M22 16.9v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.57 2.61a2 2 0 0 1-.45 2.11L8.1 9.57a16 16 0 0 0 6.33 6.33l1.13-1.13a2 2 0 0 1 2.11-.45c.84.25 1.71.45 2.61.57A2 2 0 0 1 22 16.9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.1l.9-3H13V9c0-.6.4-1 1-1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M17.5 6.5h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Footer() {
  const { brand, contact, categories } = SITE_CONFIG;

  return (
    <footer className="border-t border-zinc-900 bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <p className="text-xl font-bold text-pink-500">{brand.name}</p>
            <p className="text-gray-400 mt-2">{brand.tagline}</p>
            <div className="mt-5 flex gap-3">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-4 py-2 rounded bg-pink-600 hover:opacity-90"
              >
                Shop
              </Link>
              <Link
                href="/account/spin"
                className="inline-flex items-center justify-center px-4 py-2 rounded bg-zinc-900 border border-zinc-800 hover:border-pink-500"
              >
                Spin
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="font-semibold text-white">Quick Links</p>
            <ul className="mt-3 space-y-2 text-gray-400">
              <li>
                <Link href="/" className="hover:text-pink-400">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-pink-400">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-pink-400">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-pink-400">
                  Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <p className="font-semibold text-white">Categories</p>
            <ul className="mt-3 space-y-2 text-gray-400">
              {categories.map((c) => (
                <li key={c} className="hover:text-pink-400">
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us (icons only) */}
          <div>
            <p className="font-semibold text-white">Contact Us</p>

            <div className="mt-4 flex items-center gap-4">
              <a
                href={`mailto:${contact.email}`}
                aria-label="Email"
                className="h-11 w-11 rounded-full bg-zinc-900 border border-zinc-800 hover:border-pink-500 flex items-center justify-center text-gray-200 hover:text-white"
              >
                <IconMail />
              </a>

              <a
                href={`tel:${contact.phone}`}
                aria-label="Phone"
                className="h-11 w-11 rounded-full bg-zinc-900 border border-zinc-800 hover:border-pink-500 flex items-center justify-center text-gray-200 hover:text-white"
              >
                <IconPhone />
              </a>

              <a
                href={contact.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="h-11 w-11 rounded-full bg-zinc-900 border border-zinc-800 hover:border-pink-500 flex items-center justify-center text-gray-200 hover:text-white"
              >
                <IconFacebook />
              </a>

              <a
                href={contact.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="h-11 w-11 rounded-full bg-zinc-900 border border-zinc-800 hover:border-pink-500 flex items-center justify-center text-gray-200 hover:text-white"
              >
                <IconInstagram />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>© 2025 {brand.name}</p>
          <p>All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}
