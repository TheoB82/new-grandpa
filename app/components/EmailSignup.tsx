"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";

type Status = "idle" | "loading" | "success" | "duplicate" | "error";

export default function EmailSignup({ source = "footer" }: { source?: string }) {
  const { lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    const { error } = await supabase.from("subscribers").insert({ email: email.trim().toLowerCase(), source, lang });

    if (!error) {
      setStatus("success");
      setEmail("");
      return;
    }

    // Postgres unique_violation on the email column
    if (error.code === "23505") {
      setStatus("duplicate");
      return;
    }

    setStatus("error");
  }

  const copy = {
    heading: lang === "gr" ? "Νέες συνταγές στα εισερχόμενά σου" : "New recipes in your inbox",
    sub: lang === "gr"
      ? "Γράψου για να μαθαίνεις πρώτος/η κάθε νέα συνταγή."
      : "Sign up to hear about every new recipe first.",
    placeholder: lang === "gr" ? "Το email σου" : "Your email",
    button: lang === "gr" ? "Εγγραφή" : "Subscribe",
    loading: lang === "gr" ? "Αποστολή..." : "Submitting...",
    success: lang === "gr" ? "Ευχαριστούμε! Εγγραφήκατε." : "Thanks — you're subscribed!",
    duplicate: lang === "gr" ? "Είσαι ήδη εγγεγραμμένος/η." : "You're already subscribed.",
    error: lang === "gr" ? "Κάτι πήγε στραβά. Δοκίμασε ξανά." : "Something went wrong. Please try again.",
  };

  if (status === "success" || status === "duplicate") {
    return (
      <div className="text-center text-sm text-[#fdd9a1] font-medium py-2">
        {status === "success" ? copy.success : copy.duplicate}
      </div>
    );
  }

  return (
    <div className="text-center">
      <h3 className="font-semibold text-white mb-1">{copy.heading}</h3>
      <p className="text-sm opacity-70 mb-4">{copy.sub}</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.placeholder}
          className="flex-1 py-2.5 px-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[#8c5e3c]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="py-2.5 px-5 rounded-lg bg-[#8c5e3c] hover:bg-[#a06b45] text-white font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {status === "loading" ? copy.loading : copy.button}
        </button>
      </form>
      {status === "error" && (
        <p className="text-sm text-red-300 mt-2">{copy.error}</p>
      )}
    </div>
  );
}
