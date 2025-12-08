export default function extractYouTubeID(url: string) {
    try {
      const u = new URL(url);
  
      if (u.hostname === "youtu.be") return u.pathname.slice(1);
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/")) return u.pathname.replace("/embed/", "");
      if (u.pathname.startsWith("/shorts/")) return u.pathname.replace("/shorts/", "");
    } catch {}
  
    return "";
  }
  