// -------------------------------------------------------------
// Category Types
// -------------------------------------------------------------
export interface CategoryItem {
  name: string;            // Display name in the current language
  path: string;            // URL-friendly path
  en: string;              // English name
  gr: string;              // Greek name
  tagVariants?: string[];  // Case-insensitive substrings matched against TagsGR/TagsEN
}

// -------------------------------------------------------------
// CATEGORY MAPPING — clean & structured
// -------------------------------------------------------------
export const categoryMapping: Record<"gr" | "en", CategoryItem[]> = {
  gr: [
    { name: "Μεζέδες", path: "mezedes", en: "Starters", gr: "Μεζέδες" },
    { name: "Κυρίως", path: "kyrios", en: "Mains", gr: "Κυρίως" },
    { name: "Ψωμιά & Ζύμες", path: "psomia-zymes", en: "Breads & Dough", gr: "Ψωμιά & Ζύμες" },
    { name: "Μερακλίδικα", path: "meraklidika", en: "Specials", gr: "Μερακλίδικα" },
    { name: "Μπάρμπεκιου", path: "barbekiou", en: "Barbecue", gr: "Μπάρμπεκιου" },
    { name: "Εορταστικά", path: "eortastika", en: "Festive", gr: "Εορταστικά" },

    // Two distinct concepts, previously incorrectly merged into one:
    // Νηστίσιμα (Lenten/fasting-appropriate: no meat, dairy, or eggs — seafood OK)
    // is not the same set as Vegetarian (no meat/fish, dairy & eggs OK).
    {
      name: "Νηστίσιμα",
      path: "nistisima",
      en: "Lenten",
      gr: "Νηστίσιμα",
      tagVariants: ["νηστίσιμ", "lenten", "lent", "fasting"],
    },
    {
      name: "Χορτοφαγικά",
      path: "chortofagika",
      en: "Vegetarian",
      gr: "Χορτοφαγικά",
      tagVariants: ["vegetarian", "χορτοφαγικ"],
    },

    { name: "Γλυκά", path: "glyka", en: "Desserts", gr: "Γλυκά" }
  ],

  en: [
    { name: "Starters", path: "starters", en: "Starters", gr: "Μεζέδες" },
    { name: "Mains", path: "mains", en: "Mains", gr: "Κυρίως" },
    { name: "Breads & Dough", path: "breads-dough", en: "Breads & Dough", gr: "Ψωμιά & Ζύμες" },
    { name: "Specials", path: "specials", en: "Specials", gr: "Μερακλίδικα" },
    { name: "Barbecue", path: "barbecue", en: "Barbecue", gr: "Μπάρμπεκιου" },
    { name: "Festive", path: "festive", en: "Festive", gr: "Εορταστικά" },

    {
      name: "Lenten",
      path: "lenten",
      en: "Lenten",
      gr: "Νηστίσιμα",
      tagVariants: ["νηστίσιμ", "lenten", "lent", "fasting"],
    },
    {
      name: "Vegetarian",
      path: "vegetarian",
      en: "Vegetarian",
      gr: "Χορτοφαγικά",
      tagVariants: ["vegetarian", "χορτοφαγικ"],
    },

    { name: "Desserts", path: "desserts", en: "Desserts", gr: "Γλυκά" }
  ],
};
