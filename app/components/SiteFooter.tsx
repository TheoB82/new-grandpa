"use client";

import Link from "next/link";
import MetiflowLogo from "@/components/MetiflowLogo";
import EmailSignup from "@/components/EmailSignup";

const SOCIALS = [
  {
    label: "YouTube",
    href: "https://www.youtube.com/@GrandpaTassoscooking",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.8 15.5V8.5l6.3 3.5-6.3 3.5z"/>
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/grandpatassos.cooking.3",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.6l-.4 3h-2.2v7A10 10 0 0 0 22 12z"/>
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/grandpa_tassos_cooking/",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.6 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.3 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.3 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zm0-2.2C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9C.3 21.3 2.7 23.7 7.1 23.9c1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/>
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@grandpa_tassos_cooking",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.6 3a4.6 4.6 0 0 1-4.6-4.6h-3v14.5a2.7 2.7 0 1 1-2-2.6V7a6.7 6.7 0 1 0 5.7 6.6V8.4a7.5 7.5 0 0 0 4.6 1.6V6.6A4.6 4.6 0 0 1 19.6 3z"/>
      </svg>
    ),
  },
  {
    label: "Pinterest",
    href: "https://de.pinterest.com/ta23bra/",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 5.1 3.1 9.4 7.6 11.2-.1-1-.2-2.5.1-3.6.2-.9 1.5-6.4 1.5-6.4s-.4-.8-.4-1.9c0-1.8 1-3.1 2.3-3.1 1.1 0 1.6.8 1.6 1.8 0 1.1-.7 2.7-1.1 4.2-.3 1.3.6 2.3 1.9 2.3 2.3 0 3.8-2.9 3.8-6.4 0-2.6-1.8-4.5-4.8-4.5-3.4 0-5.5 2.6-5.5 5.3 0 1 .3 1.6.8 2.2.2.3.3.4.1 1-.1.3-.3 1.1-.4 1.4-.1.5-.5.7-.9.5-1.7-.7-2.5-2.6-2.5-4.7 0-3.8 3.1-8.3 9.3-8.3 4.9 0 8.1 3.6 8.1 7.4 0 5-2.8 8.7-6.7 8.7-1.3 0-2.6-.7-3-1.5l-.8 3.2c-.3 1.1-1.1 2.5-1.6 3.3.9.3 1.9.4 2.9.4 6.6 0 12-5.4 12-12S18.6 0 12 0z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#2a1b12] text-white py-8 border-t border-[#4b3425] relative z-50">
      <div className="max-w-6xl mx-auto px-6 space-y-6">

        {/* EMAIL SIGNUP */}
        <div className="pb-6 border-b border-[#4b3425]">
          <EmailSignup source="footer" />
        </div>

        {/* SOCIAL ICONS */}
        <div className="flex items-center justify-center gap-4">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#8c5e3c] transition-colors"
            >
              {s.icon}
            </a>
          ))}
        </div>

        {/* TOP ROW — Contact | Powered by | Legal */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* LEFT — Contact */}
          <div className="text-sm opacity-90">
            <span className="font-semibold">Contact:</span>{" "}
            <a
              href="mailto:grandpatassos@gmail.com"
              className="underline hover:text-orange-300 transition"
            >
              grandpatassos@gmail.com
            </a>
          </div>

          {/* CENTER — Powered by Metiflow */}
          <div className="flex items-center gap-2 text-sm opacity-90">
            <span>Powered by</span>
            <a
              href="mailto:admin@metiflow.com"
              aria-label="Contact Metiflow"
              className="hover:opacity-80 transition"
            >
              <MetiflowLogo size={45} textSize="text-sm" />
            </a>
          </div>

          {/* RIGHT — Legal */}
          <div className="flex gap-6 text-xs opacity-80">
            <Link href="/about" className="hover:opacity-100 transition">
              About
            </Link>
            <Link href="/media-kit" className="hover:opacity-100 transition">
              Media Kit
            </Link>
            <Link href="/privacy" className="hover:opacity-100 transition">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="hover:opacity-100 transition">
              Cookie Policy
            </Link>
          </div>

        </div>

        {/* COPYRIGHT LINE */}
        <div className="text-center text-xs opacity-60 pt-1">
          © 2026 Grandpa Tassos Cooking. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
