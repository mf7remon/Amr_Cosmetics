// app/components/Footer.tsx
import Image from "next/image";
import { CONTACT, SITE } from "@/app/lib/siteConfig";

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16v12H4z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3 5.18 2 2 0 0 1 5.11 3h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L9.09 10.91a16 16 0 0 0 4 4l1.58-1.11a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M13.5 22v-8h2.7l.4-3H13.5V9.1c0-.9.2-1.5 1.5-1.5H16.7V5.1c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5V11H7v3h2.8v8h3.7z" />
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-900 bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Left: logo + about */}
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt={SITE.name}
                width={140}
                height={60}
                className="h-12 w-auto object-contain"
                priority
              />
            </div>

            <p className="mt-4 text-sm text-gray-300 leading-6">
              {SITE.footerAbout}
            </p>
          </div>

          {/* Right: contact icons only */}
          <div className="md:text-right">
            <p className="text-sm font-semibold text-gray-200">Contact Us</p>

            <div className="mt-4 flex md:justify-end gap-3">
              <a
                href={`mailto:${CONTACT.email}`}
                className="h-11 w-11 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-gray-200"
                aria-label="Email"
                title="Email"
              >
                <IconMail />
              </a>

              <a
                href={`tel:${CONTACT.phone}`}
                className="h-11 w-11 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-gray-200"
                aria-label="Phone"
                title="Phone"
              >
                <IconPhone />
              </a>

              <a
                href={CONTACT.facebook}
                target="_blank"
                rel="noreferrer"
                className="h-11 w-11 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-gray-200"
                aria-label="Facebook"
                title="Facebook"
              >
                <IconFacebook />
              </a>

              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noreferrer"
                className="h-11 w-11 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-gray-200"
                aria-label="Instagram"
                title="Instagram"
              >
                <IconInstagram />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-900 pt-6 flex items-center justify-between text-xs text-gray-400">
          <p>© {year} {SITE.name}</p>
          <p>All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}
