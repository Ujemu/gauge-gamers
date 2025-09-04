// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Set them in Vercel → Settings → Environment Variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

/**
 * Insert a new player registration.
 * We use the X handle (without '@') as the unique `username`.
 * (Duplicates will error because of the UNIQUE constraint — which you already handle in the UI.)
 */
export async function upsertPlayer({
  username,       // normalized X handle (no '@')
  twitter,        // display value like "@web3degen"
  pokerId,
  smashId,
  pudgyPartyId,   // NEW
}) {
  const payload = {
    username,
    twitter: twitter || null,
    poker_id: pokerId || null,
    smash_id: smashId || null,
    pudgy_party_id: pudgyPartyId || null,
  };

  const { data, error } = await supabase
    .from("players")
    .insert(payload)
    .select("username, twitter, poker_id, smash_id, pudgy_party_id, created_at")
    .single();

  return { data, error };
}

/** Fetch leaderboard (shared, top 100) */
export async function fetchLeaderboard() {
  const { data, error } = await supabase
    .from("players")
    .select(
      "username, twitter, poker_id, smash_id, pudgy_party_id, score_smash, score_poker, score_pudgy, created_at"
    )
    .limit(100);

  return { data, error };
}
