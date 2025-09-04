// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Minimal client (no auth/session needed for public reads/inserts)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

/** Insert a new player (registration) */
export async function upsertPlayer({ username, twitter, pokerId, smashId }) {
  const { data, error } = await supabase
    .from("players")
    .insert({
      username,
      twitter,
      poker_id: pokerId || null,
      smash_id: smashId || null,
    })
    .select()
    .single();
  return { data, error };
}

/** Fetch leaderboard (top 100) */
export async function fetchLeaderboard() {
  const { data, error } = await supabase
    .from("players")
    .select("username, score_smash, score_poker, created_at, poker_id, smash_id")
    .limit(100);
  return { data, error };
}
