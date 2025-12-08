// Normalize Greek + English strings for fuzzy search
export function normalizeSearch(str: string): string {
    if (!str) return "";
  
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")        // remove accents
      .replace(/[^\p{L}\p{N}]+/gu, " ")        // keep letters/numbers only
      .toLowerCase()
      .trim();
  }
  
  // Lightweight fuzzy match: allows partial + misspellings
  export function fuzzyIncludes(text: string, search: string): boolean {
    if (!text || !search) return false;
  
    const t = normalizeSearch(text);
    const s = normalizeSearch(search);
  
    // exact partial match
    if (t.includes(s)) return true;
  
    // allow fuzzy: check if at least 70% of characters match
    let hits = 0;
    let needed = Math.ceil(s.length * 0.7);
  
    for (let i = 0; i < s.length; i++) {
      if (t.includes(s[i])) hits++;
    }
  
    return hits >= needed;
  }
  