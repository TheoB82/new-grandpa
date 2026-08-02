"use client";

import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

const CONTENT = {
  en: {
    tag: "The story behind the channel",
    title: "About Grandpa Tassos",
    tagline: "One man, one kitchen, and a lifetime of recipes worth sharing.",
    paragraphs: [
      "Grandpa Tassos was born in 1955 in Katerini, in the Pieria region of Greece. When he was three, his family — parents and three brothers — moved to the village of Trilofos, where they lived until 1967, when they emigrated to Germany.",
      "In Germany he trained as a furrier, a trade he practiced until 1988, interrupted only by 28 months of Greek military service between 1975 and 1978. In 1988 he returned to Greece and moved into tourism, running a travel office in Katerini until 2006.",
      "That year, after the death of his wife Tula, he moved back to Germany and worked for a transport company. He retired in 2020 — and finally had the time to do what he loves most: cook.",
      "Grandpa has a daughter and two grandchildren in Sweden, and a son and a granddaughter in England. He now lives in Germany with his partner and her mother, who get to taste everything he makes.",
      "Cooking has always been his great love, and his first teacher was his mother — she kept him close while she cooked and kneaded, and showed him all her secrets.",
      "Photography was his other lifelong passion. A committed gadget-lover, he always had a camera close by — even back when camcorders were so large you needed a stroller to carry them.",
      "Eventually the two loves came together, and almost by accident — he posted a few recipes on YouTube just for fun — he became, in his own words, a “channel master,” with far more friends watching than he ever imagined.",
      "He cooks, films, edits, and does the washing up, all by himself. So if a message slips past him sometimes, it's only because he's one person doing it all — not because he doesn't want to hear from you. He genuinely loves it when people write in, share their own photos, and swap ideas.",
    ],
    quote: "“I really want you to talk to me — share your photos, your ideas, your own version of the recipe.”",
    ctaHeading: "Say hello",
    ctaBody: "Grandpa Tassos reads everything, even if it takes him a while to reply.",
    emailLabel: "grandpatassos@gmail.com",
  },
  gr: {
    tag: "Η ιστορία πίσω από το κανάλι",
    title: "Ο Παππούς Τάσος",
    tagline: "Ένας άνθρωπος, μια κουζίνα, και μια ζωή γεμάτη συνταγές που αξίζει να μοιραστεί.",
    paragraphs: [
      "Ο παππούς Τάσος γεννήθηκε το 1955 στην Κατερίνη Πιερίας. Όταν ήταν τριών ετών, μετακόμισε με τους γονείς και τους τρεις αδερφούς του στο χωριό Τρίλοφος της Πιερίας, όπου έζησαν μέχρι το 1967, όταν μετανάστευσαν στη Γερμανία.",
      "Στη Γερμανία έμαθε την τέχνη της γουνοποιίας, δουλειά που έκανε μέχρι το 1988, με μια διακοπή για τη 28μηνη στρατιωτική του θητεία (1975–1978). Το 1988 επαναπατρίστηκε και ασχολήθηκε με τα τουριστικά επαγγέλματα, διατηρώντας τουριστικό γραφείο στην Κατερίνη μέχρι το 2006.",
      "Εκείνη τη χρονιά, μετά τον θάνατο της συζύγου του Τούλας, ξαναέφυγε για τη Γερμανία, όπου εργάστηκε σε μεταφορική εταιρία. Έγινε συνταξιούχος το 2020 — και επιτέλους βρήκε τον χρόνο να ασχοληθεί με αυτό που αγαπά περισσότερο: τη μαγειρική.",
      "Ο παππούς έχει μια κόρη και δύο εγγόνια στη Σουηδία, και έναν γιο και μια εγγονή στην Αγγλία. Ζει τώρα στη Γερμανία με τη σύντροφό του και τη μητέρα της, οι οποίες είναι οι τυχερές που γεύονται όλα όσα μαγειρεύει.",
      "Η μαγειρική ήταν πάντα μεγάλη του αγάπη, και πρώτη του δασκάλα ήταν η μητέρα του — τον είχε κοντά της όταν μαγείρευε και ζύμωνε, και του έδειχνε όλα της τα μυστικά.",
      "Η φωτογραφία ήταν η άλλη μεγάλη του αγάπη. Σαν αληθινός γκατζετάκιας, είχε πάντα μαζί του φωτογραφική μηχανή — ακόμα και στις εποχές που οι βιντεοκάμερες ήταν τόσο μεγάλες που χρειαζόσουν καροτσάκι για να τις μεταφέρεις.",
      "Κάποια στιγμή οι δύο αγάπες του συναντήθηκαν, σχεδόν τυχαία — έβαλε για πλάκα μερικές συνταγές στο YouTube — και έγινε, όπως λέει κι ο ίδιος, «μέγας καναλάρχης», με πολύ περισσότερους φίλους να τον παρακολουθούν απ' όσους φανταζόταν ποτέ.",
      "Μαγειρεύει, βιντεοσκοπεί, μοντάρει και κάνει και τη λάντζα, ολομόναχος. Οπότε αν κάποιο μήνυμα του ξεφύγει καμιά φορά, να ξέρετε πως είναι επειδή είναι ένας άνθρωπος που τα κάνει όλα μόνος του — όχι επειδή δεν θέλει να σας ακούσει. Του αρέσει πολύ όταν του γράφετε, μοιράζεστε τις δικές σας φωτογραφίες και ιδέες.",
    ],
    quote: "«Θέλω πολύ να επικοινωνείτε μαζί μου — να μοιράζεστε φωτογραφίες, ιδέες, τη δική σας εκδοχή της συνταγής.»",
    ctaHeading: "Πες γεια",
    ctaBody: "Ο παππούς Τάσος διαβάζει τα πάντα, ακόμα κι αν αργεί λίγο να απαντήσει.",
    emailLabel: "grandpatassos@gmail.com",
  },
};

export default function AboutClient() {
  const { lang } = useLanguage();
  const t = CONTENT[lang];

  return (
    <div className="min-h-screen bg-[#3c2718] text-white">
      {/* HERO */}
      <div className="pt-28 lg:pt-32 pb-14 px-6 border-b border-[#8c5e3c]/20">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-3 py-1 mb-5 rounded-full text-xs font-semibold uppercase tracking-widest bg-[#8c5e3c]/25 text-[#fdd9a1] border border-[#8c5e3c]/40">
            {t.tag}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">{t.title}</h1>
          <p className="text-base md:text-lg text-white/65 max-w-xl mx-auto">{t.tagline}</p>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* PHOTO */}
        <div className="mb-14 rounded-2xl overflow-hidden shadow-2xl border border-[#8c5e3c]/30">
          <Image
            src="/grandpa-tassos-portrait.webp"
            alt="Grandpa Tassos in his kitchen"
            width={1290}
            height={645}
            className="w-full h-auto"
            priority
          />
        </div>

        {/* STORY */}
        <div className="prose prose-invert max-w-none prose-p:text-white/80 prose-p:leading-relaxed prose-p:mb-5">
          {t.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* PULL QUOTE */}
        <div className="mt-12 rounded-xl bg-[#2e1e12]/60 border-l-4 border-[#8c5e3c] px-6 py-6">
          <p className="italic text-lg text-[#fdd9a1] leading-relaxed">{t.quote}</p>
        </div>

        {/* ORNAMENTAL DIVIDER */}
        <div className="flex items-center justify-center gap-3 my-14">
          <div className="h-px w-20 bg-linear-to-r from-transparent to-[#8c5e3c]/50" />
          <span className="text-[#8c5e3c] text-sm">✦</span>
          <div className="h-px w-20 bg-linear-to-l from-transparent to-[#8c5e3c]/50" />
        </div>

        {/* CONTACT */}
        <div className="text-center">
          <h2 className="text-xl font-bold uppercase tracking-widest text-[#fdd9a1] mb-2">{t.ctaHeading}</h2>
          <p className="text-white/65 mb-2">{t.ctaBody}</p>
          <a href={`mailto:${t.emailLabel}`} className="text-[#fdd9a1] underline hover:text-white transition">
            {t.emailLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
