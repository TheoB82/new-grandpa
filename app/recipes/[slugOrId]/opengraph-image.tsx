import { ImageResponse } from "next/og";
import { getRecipeByShortId } from "@/utils/recipesData";
import { getYoutubeVideoID } from "@/utils/getYoutubeVideoID";
import { Recipe } from "@/types/recipe";

export const contentType = "image/png";
export const size        = { width: 1200, height: 630 };
export const alt         = "Recipe preview";
export const revalidate  = false;

interface Props {
  params: Promise<{ slugOrId: string }>;
}

export default async function Image({ params }: Props) {
  const { slugOrId } = await params;
  // OG image URLs always use the canonical shortId, so fetch just this one recipe
  const recipe: Recipe | null = await getRecipeByShortId(slugOrId);

  const title    = recipe?.TitleEN    ?? "Grandpa Tassos Cooking";
  const category = recipe?.CategoryEN.join(" · ") ?? "";
  const videoID  = recipe?.LinkYT ? getYoutubeVideoID(recipe.LinkYT) : null;
  const thumb    = recipe?.Image
    ?? (videoID ? `https://img.youtube.com/vi/${videoID}/maxresdefault.jpg` : null);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
          background: "#3c2718",
        }}
      >
        {/* Background photo */}
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.45,
            }}
          />
        )}

        {/* Dark gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(30,10,3,0.95) 0%, rgba(30,10,3,0.55) 55%, rgba(30,10,3,0.1) 100%)",
          }}
        />

        {/* Bottom content */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "48px 56px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {category && (
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 4,
                color: "#fdd9a1",
                opacity: 0.85,
              }}
            >
              {category}
            </span>
          )}

          <span
            style={{
              fontSize: title.length > 40 ? 50 : 62,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            {title}
          </span>

          <span style={{ fontSize: 22, color: "#fdd9a1", opacity: 0.7, marginTop: 4 }}>
            grandpatassos.cooking
          </span>
        </div>

        {/* Top-left branding */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 56,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              background: "#8c5e3c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            👨‍🍳
          </div>
          <span style={{ fontSize: 22, color: "#fdd9a1", fontWeight: 700 }}>
            Grandpa Tassos Cooking
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
