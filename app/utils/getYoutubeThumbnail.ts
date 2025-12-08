// Extract a YouTube video ID from any YouTube URL
export function extractYouTubeID(url: string | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // Handles https://youtu.be/XXXXX
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1);
    }

    // Handles https://www.youtube.com/watch?v=XXXXX
    const v = parsed.searchParams.get("v");
    if (v) return v;

    // Handles https://www.youtube.com/embed/XXXXX
    if (parsed.pathname.startsWith("/embed/")) {
      return parsed.pathname.replace("/embed/", "");
    }

    // Handles YouTube shorts
    if (parsed.pathname.startsWith("/shorts/")) {
      return parsed.pathname.replace("/shorts/", "");
    }

    return null;
  } catch (e) {
    return null;
  }
}

// Generate thumbnail URL
export function getYoutubeThumbnail(url: string | undefined): string {
  const id = extractYouTubeID(url);
  if (!id) return "/placeholder.jpg";

  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
