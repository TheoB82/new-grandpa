"use client";

import { useState, useMemo } from "react";
import { getYoutubeVideoID } from "@/utils/getYoutubeVideoID";
import { recipeToRow } from "@/utils/mapRecipeRow";
import type { Recipe } from "@/types/recipe";
import RecipeClient from "../recipes/[slugOrId]/recipe-client";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { en: "Starters",       gr: "Μεζέδες" },
  { en: "Mains",          gr: "Κυρίως" },
  { en: "Breads & Dough", gr: "Ψωμιά & Ζύμες" },
  { en: "Specials",       gr: "Μερακλίδικα" },
  { en: "Barbecue",       gr: "Μπάρμπεκιου" },
  { en: "Festive",        gr: "Εορταστικά" },
  { en: "Lenten",         gr: "Νηστίσιμα" },
  { en: "Vegetarian",     gr: "Χορτοφαγικά" },
  { en: "Desserts",       gr: "Γλυκά" },

];

/* ------------------------------------------------------------------ */
/* HTML <-> plain-text helpers                                         */
/* One line per paragraph/step in the textareas; converted to simple   */
/* <p>/<li> HTML on save, matching what RecipeClient already expects.  */
/* Note: this strips any inline formatting (e.g. <strong>) that may    */
/* exist in older recipes — a known trade-off for keeping editing      */
/* simple (plain lines) rather than building a rich-text editor.       */
/* ------------------------------------------------------------------ */

function toIngredients(text: string): string {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => `<p>${l}</p>`).join("\n");
}

function toSteps(text: string): string {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return "";
  const parts: string[] = [];
  let inList = false;
  for (const line of lines) {
    if (line.startsWith("# ")) {
      if (inList) { parts.push("</ol>"); inList = false; }
      parts.push(`<h3>${line.slice(2)}</h3>`);
    } else {
      if (!inList) { parts.push("<ol>"); inList = true; }
      parts.push(`  <li><p>${line}</p></li>`);
    }
  }
  if (inList) parts.push("</ol>");
  return parts.join("\n");
}

function toTags(text: string): string {
  return JSON.stringify(text.split(",").map((t) => t.trim()).filter(Boolean));
}

function htmlToLines(html: string): string {
  if (!html) return "";
  const lines: string[] = [];
  // Match h3 (section headings) and li (steps) in document order
  for (const m of html.matchAll(/<(h3|li)[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const text = m[2].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
    if (text) lines.push(m[1].toLowerCase() === "h3" ? `# ${text}` : text);
  }
  if (lines.length) return lines.join("\n");
  // Fallback for plain-text or older formats
  return html.replace(/<[^>]+>/g, "").trim();
}

function tagsJsonToCsv(json: string): string {
  try {
    const arr = JSON.parse(json || "[]");
    return Array.isArray(arr) ? arr.join(", ") : "";
  } catch {
    return "";
  }
}

function dmyToISO(dmy: string): string {
  const [d, m, y] = (dmy || "").split("/");
  if (!d || !m || !y) return new Date().toISOString().split("T")[0];
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function isoToDMY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* ------------------------------------------------------------------ */
/* Form state                                                          */
/* ------------------------------------------------------------------ */

type Form = {
  categoryGR: string;
  categoryEN: string;
  date: string; // yyyy-mm-dd, for <input type="date">
  linkYT: string;
  titleGR: string; titleEN: string;
  shortDescGR: string; shortDescEN: string;
  ingredientsGR: string; ingredientsEN: string;
  stepsGR: string; stepsEN: string;
  longDescGR: string; longDescEN: string;
  tagsGR: string; tagsEN: string;
  photoUrl: string;
  galleryPhotos: string[];
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  servings: string;
  difficulty: "" | "Easy" | "Medium" | "Hard";
  caloriesPerServing: string;
  seasons: string[];
};

const SEASONS: { value: string; en: string; gr: string }[] = [
  { value: "spring", en: "Spring", gr: "Άνοιξη" },
  { value: "summer", en: "Summer", gr: "Καλοκαίρι" },
  { value: "autumn", en: "Autumn", gr: "Φθινόπωρο" },
  { value: "winter", en: "Winter", gr: "Χειμώνας" },
];

function recipeToForm(recipe: Recipe | null): Form {
  if (!recipe) {
    return {
      categoryGR: "Γλυκά",
      categoryEN: "Desserts",
      date: new Date().toISOString().split("T")[0],
      linkYT: "",
      titleGR: "", titleEN: "",
      shortDescGR: "", shortDescEN: "",
      ingredientsGR: "", ingredientsEN: "",
      stepsGR: "", stepsEN: "",
      longDescGR: "", longDescEN: "",
      tagsGR: "", tagsEN: "",
      photoUrl: "",
      galleryPhotos: [],
      prepTimeMinutes: "", cookTimeMinutes: "", servings: "",
      difficulty: "", caloriesPerServing: "",
      seasons: [],
    };
  }
  return {
    categoryGR: recipe.CategoryGR || CATEGORIES.find((c) => c.en === recipe.CategoryEN)?.gr || "Γλυκά",
    categoryEN: recipe.CategoryEN,
    date: dmyToISO(recipe.Date),
    linkYT: recipe.LinkYT,
    titleGR: recipe.TitleGR, titleEN: recipe.TitleEN,
    shortDescGR: recipe.ShortDescriptionGR, shortDescEN: recipe.ShortDescriptionEN,
    ingredientsGR: htmlToLines(recipe.IngredientsGR), ingredientsEN: htmlToLines(recipe.IngredientsEN),
    stepsGR: htmlToLines(recipe.ExecutionGR || ""), stepsEN: htmlToLines(recipe.ExecutionEN || ""),
    longDescGR: recipe.LongDescriptionGR || "", longDescEN: recipe.LongDescriptionEN || "",
    tagsGR: tagsJsonToCsv(recipe.TagsGR), tagsEN: tagsJsonToCsv(recipe.TagsEN),
    photoUrl: recipe.Image || "",
    galleryPhotos: recipe.GalleryPhotos || [],
    prepTimeMinutes: recipe.PrepTimeMinutes?.toString() || "",
    cookTimeMinutes: recipe.CookTimeMinutes?.toString() || "",
    servings: recipe.Servings?.toString() || "",
    difficulty: recipe.Difficulty || "",
    caloriesPerServing: recipe.CaloriesPerServing?.toString() || "",
    seasons: recipe.Seasons || [],
  };
}

function formToRecipe(form: Form, shortId: string): Recipe {
  return {
    CategoryEN: form.categoryEN,
    CategoryGR: form.categoryGR,
    Image: form.photoUrl || undefined,
    GalleryPhotos: form.galleryPhotos,
    TitleGR: form.titleGR,
    TitleEN: form.titleEN,
    ShortDescriptionGR: form.shortDescGR,
    ShortDescriptionEN: form.shortDescEN,
    LongDescriptionGR: form.longDescGR || undefined,
    LongDescriptionEN: form.longDescEN || undefined,
    IngredientsGR: toIngredients(form.ingredientsGR),
    IngredientsEN: toIngredients(form.ingredientsEN),
    ExecutionGR: toSteps(form.stepsGR),
    ExecutionEN: toSteps(form.stepsEN),
    TagsGR: toTags(form.tagsGR),
    TagsEN: toTags(form.tagsEN),
    LinkYT: form.linkYT,
    Date: isoToDMY(form.date),
    ShortID: shortId,
    PrepTimeMinutes: form.prepTimeMinutes ? Number(form.prepTimeMinutes) : undefined,
    CookTimeMinutes: form.cookTimeMinutes ? Number(form.cookTimeMinutes) : undefined,
    Servings: form.servings ? Number(form.servings) : undefined,
    Difficulty: form.difficulty || undefined,
    CaloriesPerServing: form.caloriesPerServing ? Number(form.caloriesPerServing) : undefined,
    CaloriesEstimated: false,
    Seasons: form.seasons,
  };
}

/* ================================================================== */
/* Component                                                           */
/* ================================================================== */

export default function RecipeForm({
  password,
  recipe,
  allRecipes,
  onDone,
  onCancel,
}: {
  password: string;
  recipe: Recipe | null; // null = creating new
  allRecipes: Recipe[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const isEditing = recipe !== null;
  const [form, setForm] = useState<Form>(() => recipeToForm(recipe));
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState("");
  const [tagging, setTagging] = useState(false);
  const [tagError, setTagError] = useState("");

  const set = (key: keyof Form, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const inp  = "w-full px-3 py-2.5 rounded-lg border border-[#d9b08c] bg-white text-[#3e2c18] text-sm focus:outline-none focus:ring-2 focus:ring-[#a06b45] transition";
  const area = `${inp} resize-y min-h-[130px]`;
  const lbl  = "block text-[11px] font-bold text-[#5c4321] uppercase tracking-widest mb-1.5";
  const card = "bg-white rounded-2xl border border-[#d9b08c] p-6 shadow-sm space-y-4";

  const videoID = form.linkYT ? getYoutubeVideoID(form.linkYT) : null;
  const ytThumb = videoID ? `https://img.youtube.com/vi/${videoID}/hqdefault.jpg` : null;

  // Live draft, fed directly into the real RecipeClient template.
  const draftRecipe = useMemo(
    () => formToRecipe(form, recipe?.ShortID ?? "preview"),
    [form, recipe]
  );

  async function handlePhotoUpload(files: FileList) {
    setUploading(true);
    setUploadError("");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("password", password);
        body.append("file", file);
        const res = await fetch("/api/admin/photo", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        uploaded.push(data.url);
      }
      setForm((f) => ({
        ...f,
        galleryPhotos: [...f.galleryPhotos, ...uploaded],
        photoUrl: f.photoUrl || uploaded[0], // first photo ever becomes the cover automatically
      }));
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(url: string) {
    setForm((f) => {
      const galleryPhotos = f.galleryPhotos.filter((u) => u !== url);
      return {
        ...f,
        galleryPhotos,
        photoUrl: f.photoUrl === url ? (galleryPhotos[0] || "") : f.photoUrl,
      };
    });
  }

  async function handleTranslate() {
    const hasExistingEN = !!(form.titleEN || form.shortDescEN || form.ingredientsEN || form.stepsEN);
    if (hasExistingEN && !confirm("This will overwrite the existing English fields with a fresh translation. Continue?")) {
      return;
    }
    setTranslating(true);
    setTranslateError("");
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          titleGR: form.titleGR,
          shortDescGR: form.shortDescGR,
          longDescGR: form.longDescGR,
          ingredientsGR: form.ingredientsGR.split("\n").map((l) => l.trim()).filter(Boolean),
          stepsGR: form.stepsGR.split("\n").map((l) => l.trim()).filter(Boolean),
          tagsGR: form.tagsGR.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");
      setForm((f) => ({
        ...f,
        titleEN: data.titleEN ?? f.titleEN,
        shortDescEN: data.shortDescEN ?? f.shortDescEN,
        longDescEN: data.longDescEN ?? f.longDescEN,
        ingredientsEN: Array.isArray(data.ingredientsEN) ? data.ingredientsEN.join("\n") : f.ingredientsEN,
        stepsEN: Array.isArray(data.stepsEN) ? data.stepsEN.join("\n") : f.stepsEN,
        tagsEN: Array.isArray(data.tagsEN) ? data.tagsEN.join(", ") : f.tagsEN,
      }));
    } catch (err: any) {
      setTranslateError(err.message);
    } finally {
      setTranslating(false);
    }
  }

  async function handleAutoFillNutrition() {
    setEnriching(true);
    setEnrichError("");
    try {
      const res = await fetch("/api/admin/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          title: form.titleEN || form.titleGR,
          ingredients: (form.ingredientsEN || form.ingredientsGR),
          steps: (form.stepsEN || form.stepsGR),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auto-fill failed");
      setForm((f) => ({
        ...f,
        prepTimeMinutes: data.prepTimeMinutes != null ? String(data.prepTimeMinutes) : f.prepTimeMinutes,
        cookTimeMinutes: data.cookTimeMinutes != null ? String(data.cookTimeMinutes) : f.cookTimeMinutes,
        servings: data.servings != null ? String(data.servings) : f.servings,
        difficulty: data.difficulty || f.difficulty,
        caloriesPerServing: data.caloriesPerServing != null ? String(data.caloriesPerServing) : f.caloriesPerServing,
        seasons: Array.isArray(data.seasons) && f.seasons.length === 0 ? data.seasons : f.seasons,
      }));
    } catch (err: any) {
      setEnrichError(err.message);
    } finally {
      setEnriching(false);
    }
  }

  async function handleAutoTag() {
    setTagging(true);
    setTagError("");
    try {
      const res = await fetch("/api/admin/generate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          title: form.titleEN || form.titleGR,
          categoryGR: form.categoryGR,
          categoryEN: form.categoryEN,
          ingredientsGR: form.ingredientsGR.split("\n").map((l) => l.trim()).filter(Boolean),
          ingredientsEN: form.ingredientsEN.split("\n").map((l) => l.trim()).filter(Boolean),
          stepsGR: form.stepsGR.split("\n").map((l) => l.trim()).filter(Boolean),
          stepsEN: form.stepsEN.split("\n").map((l) => l.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auto-tag failed");
      setForm((f) => ({
        ...f,
        tagsGR: Array.isArray(data.tagsGR) ? data.tagsGR.join(", ") : f.tagsGR,
        tagsEN: Array.isArray(data.tagsEN) ? data.tagsEN.join(", ") : f.tagsEN,
      }));
    } catch (err: any) {
      setTagError(err.message);
    } finally {
      setTagging(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrMsg("");

    const draft = formToRecipe(form, recipe?.ShortID ?? "");
    const row = recipeToRow(draft);

    try {
      const res = await fetch("/api/admin/recipe", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing ? { password, shortId: recipe!.ShortID, recipe: row } : { password, recipe: row }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      onDone();
    } catch (err: any) {
      setStatus("error");
      setErrMsg(err.message);
    }
  }

  async function handleDelete() {
    if (!recipe) return;
    if (!confirm(`Delete "${recipe.TitleEN}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/recipe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, shortId: recipe.ShortID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      onDone();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4ede4] pt-32 pb-24 px-4">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl font-bold text-[#3e2c18]">
            {isEditing ? "Edit Recipe" : "New Recipe"}
          </h1>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleTranslate}
              disabled={translating || !(form.titleGR || form.ingredientsGR || form.stepsGR)}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#8c5e3c]/10 text-[#8c5e3c] hover:bg-[#8c5e3c]/20 disabled:opacity-40 font-semibold transition-colors whitespace-nowrap"
            >
              {translating ? "Translating…" : "🌐 Translate GR → EN"}
            </button>
            <button
              onClick={() => setShowPreview((p) => !p)}
              className="text-xs text-[#a06b45] hover:underline lg:hidden"
            >
              {showPreview ? "Hide preview" : "Show preview"}
            </button>
            <button onClick={onCancel} className="text-xs text-[#a06b45] hover:underline">
              ← Back to list
            </button>
          </div>
        </div>
        <p className="text-sm text-[#5c4321] mb-8">
          {isEditing
            ? "Changes save straight to the live site — no rebuild needed."
            : "Fill in the form and click Save. It goes live immediately."}
        </p>

        {status === "error" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl text-red-800 text-sm">
            <strong>Error:</strong> {errMsg}
          </div>
        )}

        {translateError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl text-red-800 text-sm">
            <strong>Translation failed:</strong> {translateError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ══════════════════ FORM ══════════════════ */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── META ─────────────────────────────────── */}
            <div className={card}>
              <h2 className="font-bold text-[#3e2c18] text-base">Recipe Info</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>Category (Greek)</label>
                  <select
                    value={form.categoryGR}
                    onChange={(e) => {
                      const grVal = e.target.value;
                      const cat = CATEGORIES.find((c) => c.gr === grVal);
                      if (grVal !== "Νηστίσιμα" && cat) {
                        setForm((f) => ({ ...f, categoryGR: grVal, categoryEN: cat.en }));
                      } else {
                        set("categoryGR", grVal);
                      }
                    }}
                    className={inp}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.gr} value={c.gr}>{c.gr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>
                    Category (English)
                    {form.categoryGR === "Νηστίσιμα" && (
                      <span className="ml-1 normal-case tracking-normal font-normal text-[#a06b45]">— choose manually</span>
                    )}
                  </label>
                  <select
                    value={form.categoryEN}
                    onChange={(e) => set("categoryEN", e.target.value)}
                    disabled={form.categoryGR !== "Νηστίσιμα"}
                    className={`${inp} ${form.categoryGR !== "Νηστίσιμα" ? "opacity-60" : ""}`}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.en} value={c.en}>{c.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Date</label>
                  <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inp} />
                </div>
              </div>

              <div>
                <label className={lbl}>YouTube URL</label>
                <input
                  type="text"
                  value={form.linkYT}
                  onChange={(e) => set("linkYT", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={inp}
                />
              </div>

              {/* Photos */}
              <div>
                <label className={lbl}>Photos</label>
                <p className="text-xs text-[#5c4321] mb-2">
                  Upload one or more. The ★ cover photo is used for thumbnails across the site; every photo here also
                  shows in a gallery on the recipe page itself.
                </p>

                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length) handlePhotoUpload(files);
                    e.target.value = "";
                  }}
                  className="text-sm text-[#5c4321]"
                />
                {uploading && <p className="text-xs text-[#a06b45] mt-1">Uploading…</p>}
                {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
                {form.galleryPhotos.length === 0 && ytThumb && (
                  <p className="text-xs text-[#5c4321] mt-1">No photos yet — using the YouTube thumbnail for now.</p>
                )}

                {form.galleryPhotos.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-3">
                    {form.galleryPhotos.map((url) => {
                      const isCover = url === form.photoUrl;
                      return (
                        <div
                          key={url}
                          className={`group relative rounded-lg overflow-hidden border-2 ${isCover ? "border-[#8c5e3c]" : "border-transparent"}`}
                        >
                          <img src={url} alt="" className="w-full h-20 object-cover" />
                          {isCover && (
                            <span className="absolute top-1 left-1 text-[9px] font-bold bg-[#8c5e3c] text-white px-1.5 py-0.5 rounded-full">
                              ★ Cover
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => set("photoUrl", url)}
                                title="Set as cover"
                                className="text-[10px] font-semibold bg-white/95 hover:bg-white px-1.5 py-0.5 rounded"
                              >
                                ★
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removePhoto(url)}
                              title="Remove photo"
                              className="text-[10px] font-semibold bg-white/95 hover:bg-white text-red-600 px-1.5 py-0.5 rounded"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── TITLE + SHORT DESC ───────────────────── */}
            <div className={card}>
              <h2 className="font-bold text-[#3e2c18] text-base">Title & Short Description</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className={lbl}>🇬🇷 Title (Greek)</label>
                    <input id="field-titleGR" required value={form.titleGR} onChange={(e) => set("titleGR", e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>🇬🇷 Short Description</label>
                    <textarea id="field-shortDescGR" required rows={3} value={form.shortDescGR} onChange={(e) => set("shortDescGR", e.target.value)} className={`${inp} resize-none`} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={lbl}>🇬🇧 Title (English)</label>
                    <input id="field-titleEN" required value={form.titleEN} onChange={(e) => set("titleEN", e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>🇬🇧 Short Description</label>
                    <textarea id="field-shortDescEN" required rows={3} value={form.shortDescEN} onChange={(e) => set("shortDescEN", e.target.value)} className={`${inp} resize-none`} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── TIME / SERVINGS / DIFFICULTY / CALORIES ── */}
            <div className={card}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-[#3e2c18] text-base">
                  Time & Nutrition <span className="text-xs font-normal text-[#a06b45]">optional</span>
                </h2>
                <button
                  type="button"
                  onClick={handleAutoFillNutrition}
                  disabled={enriching || !(form.ingredientsEN || form.ingredientsGR || form.stepsEN || form.stepsGR)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#8c5e3c]/10 text-[#8c5e3c] hover:bg-[#8c5e3c]/20 disabled:opacity-40 font-semibold transition-colors whitespace-nowrap"
                >
                  {enriching ? "Estimating…" : "✨ Auto-fill"}
                </button>
              </div>
              {enrichError && <p className="text-xs text-red-600">{enrichError}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <label className={lbl}>Prep (min)</label>
                  <input type="number" min="0" value={form.prepTimeMinutes} onChange={(e) => set("prepTimeMinutes", e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Cook (min)</label>
                  <input type="number" min="0" value={form.cookTimeMinutes} onChange={(e) => set("cookTimeMinutes", e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Servings</label>
                  <input type="number" min="0" value={form.servings} onChange={(e) => set("servings", e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Difficulty</label>
                  <select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} className={inp}>
                    <option value="">—</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Calories</label>
                  <input type="number" min="0" value={form.caloriesPerServing} onChange={(e) => set("caloriesPerServing", e.target.value)} className={inp} />
                </div>
              </div>

              <div>
                <label className={lbl}>Season(s)</label>
                <p className="text-xs text-[#5c4321] mb-2">Used by the weekly meal planner. Leave none selected for an any-season dish.</p>
                <div className="flex flex-wrap gap-2">
                  {SEASONS.map((s) => {
                    const active = form.seasons.includes(s.value);
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            seasons: active ? f.seasons.filter((v) => v !== s.value) : [...f.seasons, s.value],
                          }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          active
                            ? "bg-[#8c5e3c] text-white border-[#8c5e3c]"
                            : "bg-white text-[#5c4321] border-[#d9b08c] hover:bg-[#f9f3ea]"
                        }`}
                      >
                        {s.en} / {s.gr}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── INGREDIENTS ──────────────────────────── */}
            <div className={card}>
              <h2 className="font-bold text-[#3e2c18] text-base">Ingredients</h2>
              <p className="text-xs text-[#5c4321]">One ingredient per line — each line becomes a separate item.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={lbl}>🇬🇷 Greek</label>
                  <textarea id="field-ingredientsGR" required value={form.ingredientsGR} onChange={(e) => set("ingredientsGR", e.target.value)} className={area} />
                </div>
                <div>
                  <label className={lbl}>🇬🇧 English</label>
                  <textarea id="field-ingredientsEN" required value={form.ingredientsEN} onChange={(e) => set("ingredientsEN", e.target.value)} className={area} />
                </div>
              </div>
            </div>

            {/* ── STEPS ────────────────────────────────── */}
            <div className={card}>
              <h2 className="font-bold text-[#3e2c18] text-base">Steps</h2>
              <p className="text-xs text-[#5c4321]">
                One step per line — numbered automatically. For multi-part recipes, start a section with{" "}
                <code className="bg-[#f0e2d0] px-1 rounded text-[10px]"># Section Name</code> on its own line (e.g.{" "}
                <code className="bg-[#f0e2d0] px-1 rounded text-[10px]"># Κρέμα βάσης</code>), then list its steps below.
                Each section restarts numbering from 1.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={lbl}>🇬🇷 Greek</label>
                  <textarea id="field-stepsGR" required value={form.stepsGR} onChange={(e) => set("stepsGR", e.target.value)} className={area} />
                </div>
                <div>
                  <label className={lbl}>🇬🇧 English</label>
                  <textarea id="field-stepsEN" required value={form.stepsEN} onChange={(e) => set("stepsEN", e.target.value)} className={area} />
                </div>
              </div>
            </div>

            {/* ── STORY (optional) ─────────────────────── */}
            <div className={card}>
              <h2 className="font-bold text-[#3e2c18] text-base">
                Story / Long Description <span className="text-xs font-normal text-[#a06b45]">optional</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={lbl}>🇬🇷 Greek</label>
                  <textarea value={form.longDescGR} onChange={(e) => set("longDescGR", e.target.value)} className={area} />
                </div>
                <div>
                  <label className={lbl}>🇬🇧 English</label>
                  <textarea value={form.longDescEN} onChange={(e) => set("longDescEN", e.target.value)} className={area} />
                </div>
              </div>
            </div>

            {/* ── TAGS (optional) ──────────────────────── */}
            <div className={card}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-[#3e2c18] text-base">
                  Tags <span className="text-xs font-normal text-[#a06b45]">optional</span>
                </h2>
                <button
                  type="button"
                  onClick={handleAutoTag}
                  disabled={tagging || !(form.ingredientsGR || form.ingredientsEN || form.titleGR || form.titleEN)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#8c5e3c]/10 text-[#8c5e3c] hover:bg-[#8c5e3c]/20 disabled:opacity-40 font-semibold transition-colors whitespace-nowrap"
                >
                  {tagging ? "Generating…" : "🏷️ Auto-tag"}
                </button>
              </div>
              {tagError && <p className="text-xs text-red-600">{tagError}</p>}
              <p className="text-xs text-[#5c4321]">Comma-separated. Used for search, categories, and similar-recipe suggestions.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>🇬🇷 Greek tags</label>
                  <input value={form.tagsGR} onChange={(e) => set("tagsGR", e.target.value)} placeholder="Γλυκό, Παραδοσιακό, ..." className={inp} />
                </div>
                <div>
                  <label className={lbl}>🇬🇧 English tags</label>
                  <input value={form.tagsEN} onChange={(e) => set("tagsEN", e.target.value)} placeholder="Dessert, Traditional, ..." className={inp} />
                </div>
              </div>
            </div>

            {/* ── SUBMIT ───────────────────────────────── */}
            <div className="flex items-center justify-between pt-2">
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-3 text-red-700 hover:bg-red-50 disabled:opacity-50 font-semibold rounded-xl transition-colors text-sm"
                >
                  {deleting ? "Deleting…" : "Delete Recipe"}
                </button>
              ) : <span />}
              <button
                type="submit"
                disabled={status === "saving"}
                className="px-8 py-3 bg-[#8c5e3c] hover:bg-[#a06b45] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-lg text-sm"
              >
                {status === "saving" ? "Saving…" : isEditing ? "Save Changes →" : "Publish Recipe →"}
              </button>
            </div>
          </form>

          {/* ══════════════════ LIVE PREVIEW ══════════════════ */}
          <div className={`${showPreview ? "block" : "hidden"} lg:block lg:sticky lg:top-24`}>
            <p className="text-[11px] font-bold text-[#5c4321] uppercase tracking-widest mb-2">
              Live Preview — exactly what visitors will see
            </p>
            <div className="rounded-2xl border border-[#8c5e3c]/40 shadow-lg overflow-hidden max-h-[80vh] overflow-y-auto">
              <RecipeClient recipe={draftRecipe} recipes={allRecipes} previewMode />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
