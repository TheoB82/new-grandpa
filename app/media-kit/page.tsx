import type { Metadata } from "next";
import MediaKitClient from "./media-kit-client";

export const metadata: Metadata = {
  title: "Media Kit | Grandpa Tassos Cooking",
  description:
    "Partner with Grandpa Tassos Cooking — authentic Greek & Mediterranean recipes reaching hundreds of thousands across YouTube, Facebook, Instagram, and TikTok.",
  alternates: { canonical: "/media-kit" },
  openGraph: {
    title: "Media Kit | Grandpa Tassos Cooking",
    description:
      "Partner with Grandpa Tassos Cooking — authentic Greek & Mediterranean recipes reaching hundreds of thousands across YouTube, Facebook, Instagram, and TikTok.",
    siteName: "Grandpa Tassos Cooking",
    type: "website",
  },
};

export default function MediaKitPage() {
  return <MediaKitClient />;
}
