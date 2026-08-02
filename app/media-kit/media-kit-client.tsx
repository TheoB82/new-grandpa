"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const STATS = [
  { value: "203K", en: "YouTube subscribers", gr: "Συνδρομητές YouTube" },
  { value: "118K", en: "Facebook followers", gr: "Ακόλουθοι Facebook" },
  { value: "15.1K", en: "Instagram followers", gr: "Ακόλουθοι Instagram" },
  { value: "4.1K", en: "TikTok followers", gr: "Ακόλουθοι TikTok" },
];

const PILLARS = [
  { en: "Mains", gr: "Κυρίως", count: 111 },
  { en: "Breads & Dough", gr: "Ψωμιά & Ζύμες", count: 88 },
  { en: "Desserts", gr: "Γλυκά", count: 84 },
  { en: "Starters", gr: "Μεζέδες", count: 58 },
  { en: "Specials", gr: "Μερακλίδικα", count: 37 },
  { en: "Festive", gr: "Εορταστικά", count: 24 },
  { en: "Barbecue", gr: "Μπάρμπεκιου", count: 7 },
];

const FIT = {
  en: [
    "Olive oil & Mediterranean pantry brands",
    "Greek dairy — feta, yogurt, and traditional cheeses",
    "Cookware & bakeware (a natural fit for a channel built on dough and pastry work)",
    "Small kitchen appliances (mixers, ovens)",
    "Greek supermarket chains and grocery brands",
    "Tourism & hospitality brands with a Greek angle",
  ],
  gr: [
    "Μάρκες ελαιολάδου & μεσογειακών προϊόντων",
    "Ελληνικά γαλακτοκομικά — φέτα, γιαούρτι, παραδοσιακά τυριά",
    "Σκεύη κουζίνας & φούρνου (φυσική ταύτιση για ένα κανάλι χτισμένο πάνω σε ζύμες)",
    "Μικρές οικιακές συσκευές (μίξερ, φούρνοι)",
    "Ελληνικές αλυσίδες σούπερ μάρκετ και προϊόντα παντοπωλείου",
    "Brands τουρισμού & φιλοξενίας με ελληνικό προσανατολισμό",
  ],
};

export default function MediaKitClient() {
  const { lang } = useLanguage();

  const copy = {
    tag: lang === "gr" ? "Συνεργαστείτε με το Grandpa Tassos Cooking" : "Partner with Grandpa Tassos Cooking",
    title: "Media Kit",
    tagline:
      lang === "gr"
        ? "Αυθεντική ελληνική & μεσογειακή κουζίνα, γυρισμένη και μοιρασμένη από έναν αφοσιωμένο ερασιτέχνη μάγειρα — για ένα κοινό που επιστρέφει κάθε εβδομάδα για το αληθινό πράγμα."
        : "Authentic Greek & Mediterranean cooking, filmed and shared by one dedicated home cook — for an audience that comes back every week for the real thing.",
    aboutHeading: lang === "gr" ? "Ποιος είναι ο παππούς Τάσος" : "Who is Grandpa Tassos",
    aboutBody:
      lang === "gr"
        ? "Ο παππούς Τάσος είναι μια μονοπρόσωπη παραγωγή — μαγειρεύει, βιντεοσκοπεί, μοντάρει και δημοσιεύει κάθε συνταγή μόνος του, από τη δική του κουζίνα. Αυτή η αυθεντικότητα, χωρίς επιτήδευση, είναι ακριβώς αυτό που κρατά εκατοντάδες χιλιάδες ανθρώπους να επιστρέφουν."
        : "Grandpa Tassos is a one-man production — he cooks, films, edits, and publishes every recipe himself, from his own kitchen. That hands-on, unpolished authenticity is exactly what keeps hundreds of thousands of people coming back.",
    aboutLink: lang === "gr" ? "Διάβασε την ιστορία του" : "Read his full story",
    pillarsHeading: lang === "gr" ? "Θεματικές Ενότητες Περιεχομένου" : "Content Pillars",
    pillarsSub:
      lang === "gr"
        ? "409 συνταγές και συνεχίζει, στα Ελληνικά και στα Αγγλικά."
        : "409 recipes and counting, published in both Greek and English.",
    fitHeading: lang === "gr" ? "Γιατί να συνεργαστείτε" : "Why Partner",
    fitReasons: [
      lang === "gr"
        ? "Αυθεντική, αξιόπιστη φωνή — δεκαετίες πραγματικής εμπειρίας σπιτικής μαγειρικής, όχι στημένη παρουσίαση στούντιο."
        : "A genuine, trusted voice — real home-cooking experience, not a studio performance.",
      lang === "gr"
        ? "Δίγλωσσο περιεχόμενο που φτάνει φυσικά σε ελληνικές κοινότητες εντός και εκτός Ελλάδας."
        : "Bilingual content that naturally reaches Greek communities at home and abroad.",
      lang === "gr"
        ? "Σταθερή, εβδομαδιαία παρουσία σε τέσσερις πλατφόρμες."
        : "Consistent, weekly presence across four platforms.",
    ],
    fitListHeading: lang === "gr" ? "Ιδανική ταύτιση για" : "Ideal fit for",
    contactHeading: lang === "gr" ? "Για συνεργασίες" : "For partnership inquiries",
  };

  const fitList = FIT[lang];

  return (
    <div className="min-h-screen bg-[#3c2718] text-white">
      {/* HERO */}
      <div className="pt-28 lg:pt-32 pb-14 px-6 border-b border-[#8c5e3c]/20">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-3 py-1 mb-5 rounded-full text-xs font-semibold uppercase tracking-widest bg-[#8c5e3c]/25 text-[#fdd9a1] border border-[#8c5e3c]/40">
            {copy.tag}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">{copy.title}</h1>
          <p className="text-base md:text-lg text-white/65 max-w-xl mx-auto">{copy.tagline}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
          {STATS.map((s) => (
            <div
              key={s.en}
              className="rounded-xl bg-[#2e1e12]/70 border border-[#8c5e3c]/40 px-4 py-6 text-center"
            >
              <div className="text-2xl sm:text-3xl font-bold text-[#fdd9a1] font-mono">{s.value}</div>
              <div className="text-xs sm:text-sm text-white/60 mt-1">{lang === "gr" ? s.gr : s.en}</div>
            </div>
          ))}
        </div>

        {/* ABOUT */}
        <div className="mb-16">
          <h2 className="text-xl font-bold uppercase tracking-widest text-[#fdd9a1] mb-3">{copy.aboutHeading}</h2>
          <p className="text-white/80 leading-relaxed mb-3">{copy.aboutBody}</p>
          <Link href="/about" className="text-[#fdd9a1] underline hover:text-white transition inline-flex items-center gap-1">
            {copy.aboutLink}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* CONTENT PILLARS */}
        <div className="mb-16">
          <h2 className="text-xl font-bold uppercase tracking-widest text-[#fdd9a1] mb-1">{copy.pillarsHeading}</h2>
          <p className="text-sm text-white/50 mb-6">{copy.pillarsSub}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PILLARS.map((p) => (
              <div
                key={p.en}
                className="flex items-center justify-between rounded-lg bg-[#2e1e12]/50 border border-[#8c5e3c]/25 px-4 py-3"
              >
                <span className="text-sm text-white/85">{lang === "gr" ? p.gr : p.en}</span>
                <span className="text-sm font-mono text-[#fdd9a1]/80">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WHY PARTNER */}
        <div className="mb-16">
          <h2 className="text-xl font-bold uppercase tracking-widest text-[#fdd9a1] mb-4">{copy.fitHeading}</h2>
          <ul className="space-y-2 mb-8">
            {copy.fitReasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-white/80">
                <span className="text-[#8c5e3c] mt-1">✦</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>

          <h3 className="text-sm font-semibold uppercase tracking-widest text-[#fdd9a1]/70 mb-3">
            {copy.fitListHeading}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fitList.map((f, i) => (
              <div
                key={i}
                className="text-sm text-white/75 bg-[#2e1e12]/40 border border-[#8c5e3c]/20 rounded-lg px-3 py-2"
              >
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* ORNAMENTAL DIVIDER */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="h-px w-20 bg-linear-to-r from-transparent to-[#8c5e3c]/50" />
          <span className="text-[#8c5e3c] text-sm">✦</span>
          <div className="h-px w-20 bg-linear-to-l from-transparent to-[#8c5e3c]/50" />
        </div>

        {/* CONTACT */}
        <div className="text-center">
          <h2 className="text-xl font-bold uppercase tracking-widest text-[#fdd9a1] mb-3">{copy.contactHeading}</h2>
          <a
            href="mailto:grandpatassos@gmail.com?subject=Partnership%20inquiry"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8c5e3c] hover:bg-[#a06b45] text-white font-semibold rounded-xl transition-colors shadow-lg"
          >
            grandpatassos@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
