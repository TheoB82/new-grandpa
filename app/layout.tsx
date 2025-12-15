import "./globals.css";
import { ReactNode } from "react";
import Script from "next/script";
import { LanguageProvider } from "@/context/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/SiteFooter";
import CookieBanner from "@/components/CookieBanner";
import AdsenseLoader from "@/components/AdsenseLoader";

export const metadata = {
  title: "Grandpa Tassos Cooking",
  description: "Authentic Greek & Mediterranean Recipes",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Disable Google Funding Choices popup */}
        <Script id="google-funding-choices-disable" strategy="beforeInteractive">
          {`
            window.googlefc = window.googlefc || {};
            window.googlefc.disable = true;
          `}
        </Script>

        {/* ✅ Google Consent Mode v2 (default = denied) */}
        <Script id="google-consent" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              analytics_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied'
            });
          `}
        </Script>
      </head>

      <body className="bg-[#3c2718] text-white min-h-screen flex flex-col">
        {/* ✅ Loads AdSense ONLY after Accept all */}
        <AdsenseLoader />

        <LanguageProvider>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </LanguageProvider>

        {/* ✅ Accept / Reject banner */}
        <CookieBanner />
      </body>
    </html>
  );
}
