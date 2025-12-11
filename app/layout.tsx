import "./globals.css";
import { ReactNode } from "react";
import Script from "next/script";
import { LanguageProvider } from "@/context/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/SiteFooter";

export const metadata = {
  title: "Grandpa Tassos Cooking",
  description: "Authentic Greek & Mediterranean Recipes",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2171074805444072"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>

      <body className="bg-[#3c2718] text-white min-h-screen flex flex-col">
        <LanguageProvider>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
