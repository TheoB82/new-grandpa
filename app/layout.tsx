import "./globals.css";
import { ReactNode } from "react";
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
      <head />

      <body className="bg-[#3c2718] text-white min-h-screen flex flex-col">

        <LanguageProvider>
          <Header />

          <main className="flex-1 pt-22 pb-10 relative z-10">
            {children}
          </main>

          <Footer />
        </LanguageProvider>

      </body>
    </html>
  );
}
