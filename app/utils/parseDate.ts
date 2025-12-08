export function parseDate(d: string): Date {
    if (!d) return new Date(0);
  
    const [day, month, year] = d.split("/").map(Number);
    return new Date(year, month - 1, day);
  }
  