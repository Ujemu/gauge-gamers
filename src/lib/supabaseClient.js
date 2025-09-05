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

// ---------- utils ----------
const norm = (s) => (s || "").trim().replace(/^@+/, "");

// Try username first; fallback to twitter "@handle"
async function getPlayerByNameOrTwitter(u) {
  const v = norm(u);

  // username exact match
  {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("username", v)
      .maybeSingle();
    if (!error && data) return { data };
  }

  // twitter may be stored like "@web3degen"
  {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("twitter", `@${v}`)
      .maybeSingle();
    if (!error && data) return { data };
    return { data: null, error }; // may be null if not found
  }
}

// =====================================================
//  Public API (used across the app / admin panel)
// =====================================================

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

/** List EVERY player (admin dropdown, no game ID filter) */
export async function fetchAllPlayers() {
  const { data, error } = await supabase
    .from("players")
    .select(
      "id, username, twitter, poker_id, smash_id, pudgy_party_id, score_smash, score_poker, score_pudgy, created_at",
      { count: "exact" }
    )
    .order("username", { ascending: true })
    .range(0, 9999);

  return { data, error };
}

/** Fetch one player for the "Quick Edit — Player IDs" section */
export async function adminFetchPlayer(usernameOrTwitter) {
  return await getPlayerByNameOrTwitter(usernameOrTwitter);
}

/** Update Smash/Poker/Pudgy IDs for a player (resolve by username or twitter) */
export async function adminUpdateIds(usernameOrTwitter, { pokerId, smashId, pudgyPartyId }) {
  const { data: found, error: findErr } = await getPlayerByNameOrTwitter(usernameOrTwitter);
  if (findErr || !found) return { error: findErr || new Error("Player not found") };

  const updates = {
    poker_id: pokerId ?? null,
    smash_id: smashId ?? null,
    pudgy_party_id: pudgyPartyId ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("players").update(updates).eq("username", found.username);
  return { error };
}

/**
 * Increment score for a player; supports per-game columns and negative deltas
 * @param {{ username: string, game: "smash"|"poker"|"pudgy", delta: number }}
 */
export async function adminIncScore({ username, game, delta }) {
  const d = Number(delta || 0);
  if (!username) return { error: new Error("username required") };
  if (!d) return { error: new Error("delta must be non-zero") };

  const { data: player, error: findErr } = await getPlayerByNameOrTwitter(username);
  if (findErr || !player) return { error: findErr || new Error("Player not found") };

  const SCORE_KEYS = {
    smash: "score_smash",
    poker: "score_poker",
    pudgy: "score_pudgy",
  };
  const scoreCol = SCORE_KEYS[game];
  if (!scoreCol) return { error: new Error("Invalid game key") };

  const nextVal = (player[scoreCol] || 0) + d;

  const { error } = await supabase
    .from("players")
    .update({ [scoreCol]: nextVal, updated_at: new Date().toISOString() })
    .eq("username", player.username);

  return { error };
}

/**
 * Fetch leaderboard, ordered by the requested game's score (default = smash)
 * @param {"smash"|"poker"|"pudgy"} game
 */
export async function fetchLeaderboard(game = "smash") {
  const ORDER_KEYS = {
    smash: "score_smash",
    poker: "score_poker",
    pudgy: "score_pudgy",
  };
  const orderBy = ORDER_KEYS[game] || ORDER_KEYS.smash;

  const { data, error } = await supabase
    .from("players")
    .select(
      "username, twitter, poker_id, smash_id, pudgy_party_id, score_smash, score_poker, score_pudgy, created_at"
    )
    .order(orderBy, { ascending: false })
    .range(0, 999);

  return { data, error };
}
