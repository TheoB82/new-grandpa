// utils/slugify.ts
const greekMap: Record<string, string> = {
  Α: "a", Β: "v", Γ: "g", Δ: "d", Ε: "e", Ζ: "z",
  Η: "i", Θ: "th", Ι: "i", Κ: "k", Λ: "l", Μ: "m",
  Ν: "n", Ξ: "x", Ο: "o", Π: "p", Ρ: "r", Σ: "s",
  Τ: "t", Υ: "y", Φ: "f", Χ: "x", Ψ: "ps", Ω: "o",
  ά: "a", έ: "e", ί: "i", ό: "o", ύ: "y", ή: "i", ώ: "o",
  ϊ: "i", ϋ: "y", ΐ: "i", ΰ: "y",
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z",
  η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m",
  ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s",
  τ: "t", υ: "y", φ: "f", χ: "x", ψ: "ps", ω: "o",
};

export default function slugify(str: string): string {
  // 1. Convert Greek to Latin
  const latin = str
    .split("")
    .map((ch) => greekMap[ch] ?? ch)
    .join("");

  // 2. Normalize + clean
  return latin
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}
