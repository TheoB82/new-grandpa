"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const ADSENSE_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2171074805444072";

export default function AdsenseLoader() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => {
      setEnabled(localStorage.getItem("cookie_consent") === "granted");
    };

    sync();
    window.addEventListener("cookie_consent_changed", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("cookie_consent_changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!enabled) return null;

  return <Script async src={ADSENSE_SRC} crossOrigin="anonymous" />;
}
