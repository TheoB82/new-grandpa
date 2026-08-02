"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/utils/supabaseClient";
import { mapRecipeRow, type RecipeRow } from "@/utils/mapRecipeRow";
import type { Recipe } from "@/types/recipe";
import RecipeForm from "./RecipeForm";

export default function AdminPage() {
  /* Password gate */
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [checking, setChecking] = useState(false);

  /* Recipe list */
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");

  /* View state */
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null | "new">(null);

  const inp = "w-full px-3 py-2.5 rounded-lg border border-[#d9b08c] bg-white text-[#3e2c18] text-sm focus:outline-none focus:ring-2 focus:ring-[#a06b45] transition";

  function emailBadge(r: Recipe): { text: string; className: string } | null {
    const [d, m, y] = (r.Date || "").split("/").map(Number);
    if (!d || !m || !y) return null;
    const recipeDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (recipeDate > today) {
      return { text: `⏳ Scheduled ${r.Date}`, className: "bg-amber-100 text-amber-800" };
    }
    if (r.NotifiedAt) {
      return { text: "📧 Notified", className: "bg-emerald-100 text-emerald-800" };
    }
    return null;
  }

  async function loadRecipes() {
    setLoadingList(true);
    setListError("");
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("recipe_date", { ascending: false });
    if (error) {
      setListError(error.message);
    } else {
      setRecipes((data as RecipeRow[]).map(mapRecipeRow));
    }
    setLoadingList(false);
  }

  useEffect(() => {
    if (unlocked) loadRecipes();
  }, [unlocked]);

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

  const filteredRecipes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(
      (r) =>
        r.TitleEN.toLowerCase().includes(q) ||
        r.TitleGR.toLowerCase().includes(q) ||
        r.CategoryEN.toLowerCase().includes(q)
    );
  }, [recipes, search]);

  /* ── PASSWORD GATE ─────────────────────────────────────────────── */

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#f4ede4] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-[#d9b08c] p-8 shadow-sm w-full max-w-sm">
          <div className="text-4xl mb-4 text-center">🔒</div>
          <h1 className="text-2xl font-bold text-[#3e2c18] mb-1 text-center">Admin</h1>
          <p className="text-sm text-[#5c4321] mb-6 text-center">Enter your password to manage recipes.</p>

          {pwError && (
            <p className="text-red-600 text-sm mb-4 text-center font-medium">{pwError}</p>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

  /* ── EDIT / CREATE VIEW ───────────────────────────────────────── */

  if (editingRecipe !== null) {
    return (
      <RecipeForm
        password={password}
        recipe={editingRecipe === "new" ? null : editingRecipe}
        allRecipes={recipes}
        onDone={() => {
          setEditingRecipe(null);
          loadRecipes();
        }}
        onCancel={() => setEditingRecipe(null)}
      />
    );
  }

  /* ── RECIPE LIST VIEW ─────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-[#f4ede4] pt-32 pb-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl font-bold text-[#3e2c18]">Recipes</h1>
          <div className="flex items-center gap-4">
            <a href="/meal-planner" target="_blank" rel="noopener noreferrer" className="text-xs text-[#a06b45] hover:underline">
              🍽️ Preview Suggestions
            </a>
            <button
              onClick={() => { setUnlocked(false); setPassword(""); }}
              className="text-xs text-[#a06b45] hover:underline"
            >
              🔒 Lock
            </button>
          </div>
        </div>
        <p className="text-sm text-[#5c4321] mb-8">
          {recipes.length} recipe{recipes.length === 1 ? "" : "s"}. Click one to edit, or create a new one.
        </p>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Search recipes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inp} flex-1`}
          />
          <button
            onClick={() => setEditingRecipe("new")}
            className="px-5 py-2.5 bg-[#8c5e3c] hover:bg-[#a06b45] text-white font-semibold rounded-xl transition-colors shadow-lg text-sm whitespace-nowrap"
          >
            ＋ New Recipe
          </button>
        </div>

        {listError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl text-red-800 text-sm">
            <strong>Error loading recipes:</strong> {listError}
          </div>
        )}

        {loadingList ? (
          <p className="text-sm text-[#5c4321]">Loading…</p>
        ) : (
          <div className="bg-white rounded-2xl border border-[#d9b08c] shadow-sm divide-y divide-[#f0e2d0]">
            {filteredRecipes.map((r) => {
              const badge = emailBadge(r);
              return (
                <button
                  key={r.ShortID}
                  onClick={() => setEditingRecipe(r)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#f9f3ea] transition"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[#3e2c18] truncate">{r.TitleEN}</div>
                    <div className="text-xs text-[#a06b45]">{r.TitleGR}</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {badge && (
                      <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full whitespace-nowrap ${badge.className}`}>
                        {badge.text}
                      </span>
                    )}
                    <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[#f0e2d0] text-[#5c4321] uppercase tracking-wide">
                      {r.CategoryEN}
                    </span>
                  </div>
                </button>
              );
            })}
            {filteredRecipes.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-[#5c4321]">No recipes found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
