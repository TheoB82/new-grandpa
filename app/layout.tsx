import "./globals.css";
import { ReactNode } from "react";
import Script from "next/script";
import { LanguageProvider } from "@/context/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/SiteFooter";
import BackToTop from "@/components/BackToTop";
import CookieBanner from "@/components/CookieBanner";
import AdsenseLoader from "@/components/AdsenseLoader";

export const metadata = {
  metadataBase: new URL("https://www.grandpatassos.com"),
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

        {/* ✅ Google Analytics (GA4) — loads after the consent default above is set,
            so it starts in Consent Mode's cookieless/modeled state until CookieBanner
            calls gtag('consent', 'update', ...) on accept. */}
        <Script
          id="ga4-lib"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-4N3N576X3P"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-4N3N576X3P');
          `}
        </Script>
      </head>

      <body className="min-h-screen flex flex-col">
        {/* ✅ Loads AdSense ONLY after Accept all */}
        <AdsenseLoader />

        <LanguageProvider>
          <Header />
          <main className="grow">{children}</main>
          <Footer />
          <BackToTop />
        </LanguageProvider>

        {/* ✅ Accept / Reject banner */}
        <CookieBanner />
      </body>
    </html>
  );
}
