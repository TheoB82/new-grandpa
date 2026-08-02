import type { Metadata } from "next";
import AboutClient from "./about-client";

export const metadata: Metadata = {
  title: "About Grandpa Tassos | Grandpa Tassos Cooking",
  description:
    "The story behind Grandpa Tassos Cooking — a lifelong love of cooking and photography, and the family recipes he shares one video at a time.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Grandpa Tassos",
    description:
      "The story behind Grandpa Tassos Cooking — a lifelong love of cooking and photography, and the family recipes he shares one video at a time.",
    siteName: "Grandpa Tassos Cooking",
    type: "profile",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
