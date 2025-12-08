"use client";

import Link from "next/link";
import MetiflowLogo from "@/components/MetiflowLogo";

export default function Footer() {
  return (
    <footer className="w-full bg-[#2a1b12] text-white py-6 border-t border-[#4b3425] relative z-50">
      <div className="max-w-6xl mx-auto px-6 space-y-4">

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
            <MetiflowLogo size={45} textSize="text-sm" />
          </div>

          {/* RIGHT — Legal */}
          <div className="flex gap-6 text-xs opacity-80">
            <Link href="/privacy" className="hover:opacity-100 transition">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="hover:opacity-100 transition">
              Cookie Policy
            </Link>
          </div>

        </div>

        {/* COPYRIGHT LINE */}
        <div className="text-center text-xs opacity-60 pt-2">
          © 2025 Grandpa Tassos Cooking. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
