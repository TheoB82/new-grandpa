export function getYoutubeVideoID(url: string): string | null {
    try {
      const u = new URL(url);
  
      if (u.hostname === "youtu.be") {
        return u.pathname.slice(1);
      }
  
      if (u.searchParams.get("v")) {
        return u.searchParams.get("v")!;
      }
  
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/embed/")[1];
      }
  
      if (u.pathname.startsWith("/shorts/")) {
        return u.pathname.split("/shorts/")[1];
      }
  
      return null;
    } catch {
      return null;
    }
  }
  