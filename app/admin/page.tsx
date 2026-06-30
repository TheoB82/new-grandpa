"use client";

import { useState } from "react";
import { getYoutubeVideoID } from "@/utils/getYoutubeVideoID";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { en: "Starters",      gr: "Μεζέδες" },
  { en: "Mains",         gr: "Κυρίως" },
  { en: "Breads & Dough",gr: "Ψωμιά & Ζύμες" },
  { en: "Specials",      gr: "Μερακλίδικα" },
  { en: "Barbecue",      gr: "Μπάρμπεκιου" },
  { en: "Festive",       gr: "Εορταστικά" },
  { en: "Vegetarian",    gr: "Νηστίσιμα" },
  { en: "Desserts",      gr: "Γλυκά" },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function generateShortID(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function toDateDMY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function toIngredients(text: string): string {
  return text.split("\n").map(l => l.trim()).filter(Boolean).map(l => `<p>${l}</p>`).join("\n");
}

function toSteps(text: string): string {
  const items = text.split("\n").map(l => l.trim()).filter(Boolean)
    .map(l => `  <li><p>${l}</p></li>`).join("\n");
  return `<ol>\n${items}\n</ol>`;
}

function toTags(text: string): string {
  return JSON.stringify(text.split(",").map(t => t.trim()).filter(Boolean));
}

/* ------------------------------------------------------------------ */
/* Form state                                                          */
/* ------------------------------------------------------------------ */

type Form = {
  categoryEN: string;
  date: string;
  linkYT: string;
  titleGR: string;
  titleEN: string;
  shortDescGR: string;
  shortDescEN: string;
  ingredientsGR: string;
  ingredientsEN: string;
  stepsGR: string;
  stepsEN: string;
  longDescGR: string;
  longDescEN: string;
  tagsGR: string;
  tagsEN: string;
};

const TODAY = new Date().toISOString().split("T")[0];

const EMPTY: Form = {
  categoryEN: "Desserts",
  date: TODAY,
  linkYT: "",
  titleGR: "", titleEN: "",
  shortDescGR: "", shortDescEN: "",
  ingredientsGR: "", ingredientsEN: "",
  stepsGR: "", stepsEN: "",
  longDescGR: "", longDescEN: "",
  tagsGR: "", tagsEN: "",
};

/* ================================================================== */
/* Page                                                               */
/* ================================================================== */

export default function AdminPage() {
  /* Password gate */
  const [unlocked, setUnlocked]   = useState(false);
  const [password, setPassword]   = useState("");
  const [pwError, setPwError]     = useState("");
  const [checking, setChecking]   = useState(false);

  /* Recipe form */
  const [form, setForm]     = useState<Form>(EMPTY);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const set = (key: keyof Form, val: string) => setForm(f => ({ ...f, [key]: val }));

  /* Shared Tailwind classes */
  const inp  = "w-full px-3 py-2.5 rounded-lg border border-[#d9b08c] bg-white text-[#3e2c18] text-sm focus:outline-none focus:ring-2 focus:ring-[#a06b45] transition";
  const area = `${inp} resize-y min-h-[130px]`;
  const lbl  = "block text-[11px] font-bold text-[#5c4321] uppercase tracking-widest mb-1.5";
  const card = "bg-white rounded-2xl border border-[#d9b08c] p-6 shadow-sm space-y-4";

  /* ── PASSWORD GATE ─────────────────────────────────────────────── */

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setPwError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setUnlocked(true);
      } else {
        setPwError("Wrong password. Try again.");
        setPassword("");
      }
    } catch {
      setPwError("Could not reach server. Try again.");
    } finally {
      setChecking(false);
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#f4ede4] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-[#d9b08c] p-8 shadow-sm w-full max-w-sm">
          <div className="text-4xl mb-4 text-center">🔒</div>
          <h1 className="text-2xl font-bold text-[#3e2c18] mb-1 text-center">Admin</h1>
          <p className="text-sm text-[#5c4321] mb-6 text-center">Enter your password to access the recipe form.</p>

          {pwError && (
            <p className="text-red-600 text-sm mb-4 text-center font-medium">{pwError}</p>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className={inp}
            />
            <button
              type="submit"
              disabled={checking}
              className="w-full py-3 bg-[#8c5e3c] hover:bg-[#a06b45] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {checking ? "Checking…" : "Enter →"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── RECIPE FORM ───────────────────────────────────────────────── */

  const videoID = form.linkYT ? getYoutubeVideoID(form.linkYT) : null;
  const thumb   = videoID ? `https://img.youtube.com/vi/${videoID}/hqdefault.jpg` : null;
  const cat     = CATEGORIES.find(c => c.en === form.categoryEN)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setErrMsg("");

    const recipe = {
      CategoryEN:         form.categoryEN,
      CategoryGR:         cat?.gr ?? form.categoryEN,
      Image:              "TBC",
      TitleGR:            form.titleGR,
      TitleEN:            form.titleEN,
      ShortDescriptionGR: form.shortDescGR,
      ShortDescriptionEN: form.shortDescEN,
      LongDescriptionGR:  form.longDescGR || "",
      LongDescriptionEN:  form.longDescEN || "",
      IngredientsGR:      toIngredients(form.ingredientsGR),
      IngredientsEN:      toIngredients(form.ingredientsEN),
      ExecutionGR:        toSteps(form.stepsGR),
      ExecutionEN:        toSteps(form.stepsEN),
      TagsGR:             toTags(form.tagsGR),
      TagsEN:             toTags(form.tagsEN),
      LinkYT:             form.linkYT,
      Date:               toDateDMY(form.date),
      ShortID:            generateShortID(),
    };

    try {
      const res = await fetch("/api/admin/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, recipe }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Unknown error");
      }
      setStatus("success");
      setForm(EMPTY);
    } catch (err: any) {
      setStatus("error");
      setErrMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4ede4] pt-32 pb-24 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl font-bold text-[#3e2c18]">New Recipe</h1>
          <button
            onClick={() => { setUnlocked(false); setPassword(""); }}
            className="text-xs text-[#a06b45] hover:underline"
          >
            🔒 Lock
          </button>
        </div>
        <p className="text-sm text-[#5c4321] mb-8">
          Fill in the form and click <strong>Save</strong>. The recipe is committed directly to GitHub — Vercel will rebuild and it'll be live in about a minute.
        </p>

        {/* STATUS BANNERS */}
        {status === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-xl text-green-800 text-sm font-medium">
            ✓ Recipe saved to GitHub! The site is rebuilding and will be live shortly.
          </div>
        )}
        {status === "error" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl text-red-800 text-sm">
            <strong>Error:</strong> {errMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── META ─────────────────────────────────── */}
          <div className={card}>
            <h2 className="font-bold text-[#3e2c18] text-base">Recipe Info</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Category</label>
                <select value={form.categoryEN} onChange={e => set("categoryEN", e.target.value)} className={inp}>
                  {CATEGORIES.map(c => (
                    <option key={c.en} value={c.en}>{c.en} / {c.gr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Date</label>
                <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={inp} />
              </div>
            </div>

            <div>
              <label className={lbl}>YouTube URL</label>
              <input
                type="url"
                value={form.linkYT}
                onChange={e => set("linkYT", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={inp}
              />
            </div>

            {thumb && (
              <div>
                <p className="text-[11px] text-[#5c4321] mb-1.5 font-medium uppercase tracking-wide">Thumbnail Preview</p>
                <img src={thumb} alt="Thumbnail" className="w-full max-w-xs rounded-xl border border-[#d9b08c] object-cover" />
              </div>
            )}
          </div>

          {/* ── TITLE + SHORT DESC ───────────────────── */}
          <div className={card}>
            <h2 className="font-bold text-[#3e2c18] text-base">Title & Short Description</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="space-y-4">
                <div>
                  <label className={lbl}>🇬🇷 Title (Greek)</label>
                  <input required value={form.titleGR} onChange={e => set("titleGR", e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>🇬🇷 Short Description</label>
                  <textarea required rows={3} value={form.shortDescGR} onChange={e => set("shortDescGR", e.target.value)} className={`${inp} resize-none`} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={lbl}>🇬🇧 Title (English)</label>
                  <input required value={form.titleEN} onChange={e => set("titleEN", e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>🇬🇧 Short Description</label>
                  <textarea required rows={3} value={form.shortDescEN} onChange={e => set("shortDescEN", e.target.value)} className={`${inp} resize-none`} />
                </div>
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
                <textarea
                  required
                  value={form.ingredientsGR}
                  onChange={e => set("ingredientsGR", e.target.value)}
                  placeholder={"1 κιλό αλεύρι\n2 αυγά\n3 κ.σ. ελαιόλαδο"}
                  className={area}
                />
              </div>
              <div>
                <label className={lbl}>🇬🇧 English</label>
                <textarea
                  required
                  value={form.ingredientsEN}
                  onChange={e => set("ingredientsEN", e.target.value)}
                  placeholder={"1 kg flour\n2 eggs\n3 tbsp olive oil"}
                  className={area}
                />
              </div>
            </div>
          </div>

          {/* ── STEPS ────────────────────────────────── */}
          <div className={card}>
            <h2 className="font-bold text-[#3e2c18] text-base">Steps</h2>
            <p className="text-xs text-[#5c4321]">One step per line — they'll be numbered automatically on the recipe page.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={lbl}>🇬🇷 Greek</label>
                <textarea
                  required
                  value={form.stepsGR}
                  onChange={e => set("stepsGR", e.target.value)}
                  placeholder={"Ανακατεύω όλα τα υλικά.\nΨήνω στους 180°C για 30 λεπτά."}
                  className={area}
                />
              </div>
              <div>
                <label className={lbl}>🇬🇧 English</label>
                <textarea
                  required
                  value={form.stepsEN}
                  onChange={e => set("stepsEN", e.target.value)}
                  placeholder={"Mix all ingredients.\nBake at 180°C for 30 minutes."}
                  className={area}
                />
              </div>
            </div>
          </div>

          {/* ── STORY (optional) ─────────────────────── */}
          <div className={card}>
            <h2 className="font-bold text-[#3e2c18] text-base">
              Story / Long Description{" "}
              <span className="text-xs font-normal text-[#a06b45]">optional</span>
            </h2>
            <p className="text-xs text-[#5c4321]">The storytelling paragraph shown above the steps on the recipe page.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={lbl}>🇬🇷 Greek</label>
                <textarea value={form.longDescGR} onChange={e => set("longDescGR", e.target.value)} className={area} />
              </div>
              <div>
                <label className={lbl}>🇬🇧 English</label>
                <textarea value={form.longDescEN} onChange={e => set("longDescEN", e.target.value)} className={area} />
              </div>
            </div>
          </div>

          {/* ── TAGS (optional) ──────────────────────── */}
          <div className={card}>
            <h2 className="font-bold text-[#3e2c18] text-base">
              Tags{" "}
              <span className="text-xs font-normal text-[#a06b45]">optional</span>
            </h2>
            <p className="text-xs text-[#5c4321]">Comma-separated. Used for search and similar-recipe suggestions.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>🇬🇷 Greek tags</label>
                <input value={form.tagsGR} onChange={e => set("tagsGR", e.target.value)} placeholder="Γλυκό, Παραδοσιακό, ..." className={inp} />
              </div>
              <div>
                <label className={lbl}>🇬🇧 English tags</label>
                <input value={form.tagsEN} onChange={e => set("tagsEN", e.target.value)} placeholder="Dessert, Traditional, ..." className={inp} />
              </div>
            </div>
          </div>

          {/* ── SUBMIT ───────────────────────────────── */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={status === "saving"}
              className="px-8 py-3 bg-[#8c5e3c] hover:bg-[#a06b45] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-lg text-sm"
            >
              {status === "saving" ? "Saving to GitHub…" : "Save Recipe to GitHub →"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
