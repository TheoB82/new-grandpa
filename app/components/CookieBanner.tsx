"use client";

import { useEffect, useState } from "react";

type Consent = "granted" | "denied" | null;

export default function CookieBanner() {
  const [consent, setConsent] = useState<Consent>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cookie_consent") as Consent;
    if (stored) {
      setConsent(stored);
      applyConsent(stored);
    }
  }, []);

  function applyConsent(value: Consent) {
    if (!(window as any).gtag) return;

    (window as any).gtag("consent", "update", {
      ad_storage: value === "granted" ? "granted" : "denied",
      analytics_storage: value === "granted" ? "granted" : "denied",
      ad_user_data: value === "granted" ? "granted" : "denied",
      ad_personalization: value === "granted" ? "granted" : "denied",
    });
  }

  function acceptAll() {
    localStorage.setItem("cookie_consent", "granted");
    setConsent("granted");
    applyConsent("granted");
    // Trigger other components (e.g. AdsenseLoader) to react immediately
    window.dispatchEvent(new Event("cookie_consent_changed"));
  }

  function rejectAll() {
    localStorage.setItem("cookie_consent", "denied");
    setConsent("denied");
    applyConsent("denied");
    window.dispatchEvent(new Event("cookie_consent_changed"));
  }

  if (consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black text-white p-4 text-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
        <p>
          We use cookies to show ads and improve the site. You can accept or
          reject non-essential cookies.
        </p>

        <div className="flex gap-2">
          <button onClick={rejectAll} className="px-4 py-2 bg-gray-700 rounded">
            Reject all
          </button>
          <button
            onClick={acceptAll}
            className="px-4 py-2 bg-yellow-500 text-black rounded"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
