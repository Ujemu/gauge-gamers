// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

/* -------------------- Supabase init -------------------- */
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

/* -------------------- helpers -------------------- */
const stripAt = (s) => (s || "").trim().replace(/^@+/, "");
const norm = stripAt;

/**
 * Try to find a player by exact username first,
 * then exact twitter (with @), then a loose fallback.
 */
async function getPlayerByNameOrTwitter(u) {
  const v = norm(u);

  // 1) username exact
  {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("username", v)
      .maybeSingle();
    if (!error && data) return { data };
  }

  // 2) twitter exact (stored like "@handle")
  {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("twitter", `@${v}`)
      .maybeSingle();
    if (!error && data) return { data };
  }

  // 3) loose fallback (ilike) — grab one row if multiple
  {
    const pattern = `%${v}%`;
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .or(`username.ilike.${pattern},twitter.ilike.@${pattern}`)
      .limit(1);
    if (!error && Array.isArray(data) && data[0]) return { data: data[0] };
    return { data: null, error };
  }
}

/* =====================================================
   Public API (used across the app / admin panel)
   ===================================================== */

/**
 * Insert a new player registration.
 * We use the X handle (without '@') as the unique `username`.
 */
export async function upsertPlayer({
  username,     // normalized X handle (no '@')
  twitter,      // display value like "@web3degen"
  pokerId,
  smashId,
  pudgyPartyId,
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
    .select(
      "username, twitter, poker_id, smash_id, pudgy_party_id, created_at"
    )
    .single();

  return { data, error };
}

/** List EVERY player (for other UIs that need it) */
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

/** 🚫 NEW: Only players registered for a specific game (used by Admin panel list) */
export async function fetchPlayersForGame(game = "smash") {
  const cols =
    "id, username, twitter, poker_id, smash_id, pudgy_party_id, score_smash, score_poker, score_pudgy, created_at";

  let query = supabase
    .from("players")
    .select(cols)
    .order("username", { ascending: true })
    .range(0, 9999);

  // server-side filter: id column must be NOT NULL and not empty
  if (game === "smash") {
    query = query.not("smash_id", "is", null).neq("smash_id", "");
  } else if (game === "poker") {
    query = query.not("poker_id", "is", null).neq("poker_id", "");
  } else if (game === "pudgy") {
    query = query.not("pudgy_party_id", "is", null).neq("pudgy_party_id", "");
  }

  const { data, error } = await query;
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

  const { error } = await supabase
    .from("players")
    .update(updates)
    .eq("id", found.id);
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

  // resolve player (case-insensitive; username or @twitter)
  const toLower = (s) => (s || "").trim().replace(/^@+/, "").toLowerCase();
  const v = toLower(username);

  let { data: player, error: findErr } = await supabase
    .from("players")
    .select("id, username, twitter, score_smash, score_poker, score_pudgy")
    .or(`username.ilike.${v},twitter.ilike.@${v}`)
    .maybeSingle();

  if (findErr || !player) {
    // fallback: try exact username match only
    const retry = await supabase
      .from("players")
      .select("id, username, twitter, score_smash, score_poker, score_pudgy")
      .eq("username", username)
      .maybeSingle();
    player = retry.data;
    if (retry.error || !player) {
      return { error: findErr || retry.error || new Error("Player not found") };
    }
  }

  const SCORE_KEYS = { smash: "score_smash", poker: "score_poker", pudgy: "score_pudgy" };
  const scoreCol = SCORE_KEYS[game];
  if (!scoreCol) return { error: new Error(`Invalid game key "${game}"`) };

  const nextVal = Number(player[scoreCol] || 0) + d;

  // do the update and return the fresh row
  const { data: updated, error } = await supabase
    .from("players")
    .update({ [scoreCol]: nextVal, updated_at: new Date().toISOString() })
    .eq("id", player.id)
    .select("id, username, twitter, score_smash, score_poker, score_pudgy, updated_at")
    .single();

  console.log("[adminIncScore]", { game, scoreCol, username: player.username, delta: d, nextVal, error });
  return { data: updated, error };
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
