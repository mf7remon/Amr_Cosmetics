// app/components/Footer.tsx
import Image from "next/image";

const CONTACTS = {
  email: "hurreh1234@gmail.com",
  whatsappNumberBD: "01302180147", // display friendly
  whatsappLink: "https://wa.me/8801302180147", // 01302180147 -> 8801302180147
  facebook: "https://www.facebook.com/mf.remon.14",
  instagram: "https://www.instagram.com/remon_mf_7/?next=%2F",
};

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 7.5 12 12l6.5-4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M20 11.8c0 4.5-3.7 8.2-8.2 8.2-1.4 0-2.7-.3-3.9-.9L4 20l1-3.7c-.7-1.2-1-2.6-1-4.1C4 7.7 7.7 4 12.2 4 16.7 4 20 7.3 20 11.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9.3 9.1c.2-.4.4-.4.6-.4h.5c.1 0 .3 0 .4.3l.7 1.6c.1.2.1.4 0 .5l-.3.4c-.1.1-.2.2-.1.4.2.6.9 1.3 1.5 1.7.5.3 1.1.5 1.7.6.1 0 .2 0 .3-.1l.6-.7c.1-.1.3-.1.4-.1l1.7.8c.2.1.3.2.3.4 0 .8-.4 1.5-1.2 1.9-.5.3-1.2.4-2.2.2-1.4-.3-3-.9-4.4-2.2-1.3-1.2-2.1-2.6-2.4-4-.2-1 .1-1.8.6-2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M13.5 22v-7h2.3l.4-3H13.5V10c0-.9.2-1.5 1.5-1.5h1.3V5.8c-.2 0-1.1-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V12H8v3h2.4v7h3.1Z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M7.5 3.5h9A4 4 0 0 1 20.5 7.5v9a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M17 7.3h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-zinc-900 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Left: Logo + Description */}
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Amr Cosmetics"
                width={170}
                height={60}
                className="h-12 w-auto object-contain"
                priority
              />
            </div>

            <p className="mt-3 text-sm text-gray-300">
              Amr Cosmetics brings curated beauty and lifestyle picks that feel premium, simple, and made for everyday confidence.
            </p>
          </div>

          {/* Right: Contact Icons only */}
          <div className="md:text-right">
            <p className="text-sm font-semibold text-gray-200">Contact Us</p>

            <div className="mt-4 flex md:justify-end gap-3">
              <a
                href={`mailto:${CONTACTS.email}`}
                className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-pink-500 flex items-center justify-center text-gray-200"
                aria-label="Email"
                title="Email"
              >
                <IconMail />
              </a>

              <a
                href={CONTACTS.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-pink-500 flex items-center justify-center text-gray-200"
                aria-label={`WhatsApp ${CONTACTS.whatsappNumberBD}`}
                title={`WhatsApp ${CONTACTS.whatsappNumberBD}`}
              >
                <IconWhatsApp />
              </a>

              <a
                href={CONTACTS.facebook}
                target="_blank"
                rel="noreferrer"
                className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-pink-500 flex items-center justify-center text-gray-200"
                aria-label="Facebook"
                title="Facebook"
              >
                <IconFacebook />
              </a>

              <a
                href={CONTACTS.instagram}
                target="_blank"
                rel="noreferrer"
                className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-pink-500 flex items-center justify-center text-gray-200"
                aria-label="Instagram"
                title="Instagram"
              >
                <IconInstagram />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-800 text-center text-xs text-gray-400">
          © 2025 Amr Cosmetics. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
