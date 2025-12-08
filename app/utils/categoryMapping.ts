// -------------------------------------------------------------
// Category Types
// -------------------------------------------------------------
export interface CategoryItem {
  name: string;       // Display name in the current language
  path: string;       // URL-friendly path
  en: string;         // English name
  gr: string;         // Greek name
  tagMatch?: string;  // Optional tag override (e.g. "Vegetarian")
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

    // 🌱 Greek "Νηστίσιμα" maps to English "Vegetarian" AND must match tags
    { 
      name: "Νηστίσιμα",
      path: "nistisima",
      en: "Vegetarian",
      gr: "Νηστίσιμα",
      tagMatch: "Vegetarian"   // <-- this enables tag matching
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

    // 🌱 English Vegetarian also must match tags
    {
      name: "Vegetarian",
      path: "vegetarian",
      en: "Vegetarian",
      gr: "Νηστίσιμα",
      tagMatch: "Vegetarian"   // <-- this tells the filter to use tagsEN for matching
    },

    { name: "Desserts", path: "desserts", en: "Desserts", gr: "Γλυκά" }
  ],
};
