import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only client using the secret key — bypasses Row Level Security.
// Never import this from a "use client" component or expose SUPABASE_SECRET_KEY
// via NEXT_PUBLIC_.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false },
});
