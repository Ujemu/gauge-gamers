// src/components/ScorePanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { isAdmin, setAdmin, hasPin, setPin, checkPin } from "../utils/admin";
import {
  adminFetchPlayer,
  adminIncScore,
  adminUpdateIds,
  fetchAllPlayers, // ✅ now listing ALL players
} from "../lib/supabaseClient";

/* ---------- config & small helpers ---------- */
const GAME_CONFIG = {
  smash: { title: "Smash Karts", idKey: "smash_id", scoreKey: "score_smash" },
  poker: { title: "Poker",       idKey: "poker_id",  scoreKey: "score_poker" },
  pudgy: { title: "Pudgy Party", idKey: "pudgy_party_id", scoreKey: "score_pudgy" },
};

const normHandle = (s) => (s || "").trim().replace(/^@+/, "");

/* ---------- styles (kept from your version) ---------- */
const gradient = "linear-gradient(90deg, rgb(59,130,246), rgb(236,72,153))";

const btnToggle = (authorized) => ({
  position: "fixed",
  right: 18,
  bottom: 78,
  zIndex: 60,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: authorized ? gradient : "rgba(255,255,255,0.08)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
});

const panel = {
  position: "fixed",
  right: 18,
  bottom: 130,
  zIndex: 60,
  width: 320,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(8px)",
  color: "#e5e7eb",
  boxShadow: "0 18px 40px rgba(0,0,0,0.4)",
};

const row = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 };
const label = { fontSize: 12, color: "#cbd5e1" };
const input = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  outline: "none",
};
const btnAction = {
  marginTop: 6,
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: gradient,
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};
const smallBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
const linkBtn = {
  appearance: "none",
  background: "transparent",
  border: "none",
  color: "#93c5fd",
  cursor: "pointer",
  fontWeight: 700,
};
const divider = { height: 1, background: "rgba(255,255,255,0.12)", margin: "10px 0" };

/* ---------- component ---------- */
export default function ScorePanel({ onChange }) {
  const [open, setOpen] = useState(false);
  const [authorized, setAuthorized] = useState(isAdmin());

  // game + list
  const [game, setGame] = useState("smash"); // "smash" | "poker" | "pudgy"
  const [listLoading, setListLoading] = useState(false);
  const [listErr, setListErr] = useState(null);
  const [playersByGame, setPlayersByGame] = useState([]); // [{username, twitter}]

  // selection / points
  const [selectedUsername, setSelectedUsername] = useState(""); // from dropdown
  const [points, setPoints] = useState(0);
  const [busyPoints, setBusyPoints] = useState(false);

  // quick edit IDs
  const [player, setPlayer] = useState(null);
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [pokerId, setPokerId] = useState("");
  const [smashId, setSmashId] = useState("");
  const [pudgyId, setPudgyId] = useState("");
  const [busyIds, setBusyIds] = useState(false);

  // feedback
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const resetFeedback = () => { setErr(null); setMsg(null); };

  /* --- auth toggle with PIN --- */
  const handleToggle = () => {
    if (!authorized) {
      if (!hasPin()) {
        const p1 = window.prompt("Create 4-digit Admin PIN (digits only)");
        const p2 = window.prompt("Confirm PIN");
        if (p1 && p2 && p1 === p2) {
          const res = setPin(String(p1).replace(/\D/g, "").slice(0, 4));
          if (res?.error) alert(res.error);
          else alert("PIN saved. Click Admin again and enter the PIN to unlock.");
        } else if (p1 != null && p2 != null) {
          alert("PINs did not match. Try again.");
        }
        return;
      }
      const pin = window.prompt("Enter 4-digit Admin PIN");
      if (pin && checkPin(pin)) {
        setAdmin(true);
        setAuthorized(true);
        setOpen(true);
      } else if (pin != null) {
        alert("Incorrect PIN");
      }
      return;
    }
    setOpen((v) => !v);
  };

  const logoutAdmin = () => {
    setAdmin(false);
    setAuthorized(false);
    setOpen(false);
    alert("Admin access removed.");
  };

  /* --- fetch ALL players for dropdown (no filter by ID) --- */
  async function loadPlayersForGame() {
    setListErr(null);
    setListLoading(true);
    try {
      const { data, error } = await fetchAllPlayers();
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      const mapped = rows.map((p) => {
        const fallbackHandle = normHandle(p.twitter || p.x_handle || p.handle || "");
        const uname =
          p.username || p.player_id || p.id || fallbackHandle || "";
        return {
          username: uname,
          twitter: p.twitter || p.x_handle || p.handle || "",
        };
      });
      mapped.sort((a, b) => (a.username || "").localeCompare(b.username || ""));
      setPlayersByGame(mapped);
    } catch (e) {
      setListErr(e?.message || "Failed to load players");
      setPlayersByGame([]);
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    if (open && authorized) loadPlayersForGame();
  }, [open, authorized, game]);

  // when changing selected player, preload IDs block handle
  useEffect(() => {
    setPlayer(null);
    setPokerId("");
    setSmashId("");
    setPudgyId("");
  }, [selectedUsername]);

  /* --- APPLY score delta --- */
  async function addScore() {
    resetFeedback();
    const u = normHandle(selectedUsername);
    const delta = Number(points || 0);
    if (!u) { setErr("Pick a player first."); return; }
    if (!delta) { setErr("Enter a non-zero delta."); return; }
    setBusyPoints(true);
    const { error } = await adminIncScore({ username: u, game, delta });
    setBusyPoints(false);
    if (error) { setErr(error.message || "Failed to update score"); return; }
    setMsg("Score updated ✓");
    setPoints(0);
    onChange?.();
  }

  /* --- LOAD / SAVE IDs for the selected player --- */
  async function loadSelectedPlayer() {
    resetFeedback();
    const u = normHandle(selectedUsername);
    if (!u) { setErr("Pick a player first."); return; }
    setLoadingPlayer(true);
    const { data, error } = await adminFetchPlayer(u);
    setLoadingPlayer(false);
    if (error) { setErr(error.message || "Not found"); setPlayer(null); return; }
    setPlayer(data || null);
    setPokerId(data?.poker_id || "");
    setSmashId(data?.smash_id || "");
    setPudgyId(data?.pudgy_party_id || "");
  }

  async function saveIds() {
    resetFeedback();
    const u = normHandle(selectedUsername);
    if (!u) { setErr("Pick a player first."); return; }
    setBusyIds(true);
    const { error } = await adminUpdateIds(u, {
      pokerId: pokerId.trim() || null,
      smashId: smashId.trim() || null,
      pudgyPartyId: pudgyId.trim() || null,
    });
    setBusyIds(false);
    if (error) { setErr(error.message || "Failed to update IDs"); return; }
    setMsg("Player IDs updated ✓");
    onChange?.();
  }

  /* --- derived label for player select --- */
  const options = useMemo(() => {
    return playersByGame.map((p) => ({
      value: p.username,
      label: `${p.username}${p.twitter ? ` — ${p.twitter}` : ""}`,
    }));
  }, [playersByGame]);

  return (
    <>
      <button
        onClick={handleToggle}
        style={btnToggle(authorized)}
        title={authorized ? "Open admin panel" : "Admin (PIN required)"}
      >
        {authorized ? "Admin ✓" : "Admin"}
      </button>

      {open && authorized && (
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Score Admin</strong>
            <button onClick={logoutAdmin} style={linkBtn}>Sign out</button>
          </div>

          {/* GAME FILTER */}
          <div style={row}>
            <label style={label}>Game</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                style={{ ...input, flex: 1 }}
              >
                <option value="smash">Smash Karts</option>
                <option value="poker">Poker</option>
                <option value="pudgy">Pudgy Party</option>
              </select>
              <button onClick={loadPlayersForGame} style={smallBtn}>
                Refresh
              </button>
            </div>
          </div>

          {/* PLAYERS BY SELECTED GAME */}
          <div style={row}>
            <label style={label}>
              Player (Twitter) — {listLoading ? "loading…" : listErr ? "error" : `${options.length} found`}
            </label>
            <select
              value={selectedUsername}
              onChange={(e) => setSelectedUsername(e.target.value)}
              style={input}
            >
              <option value="">Select player</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* POINTS */}
          <div style={row}>
            <label style={label}>Delta (can be negative)</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="e.g., 50"
              style={input}
            />
          </div>

          <button onClick={addScore} style={btnAction} disabled={busyPoints}>
            {busyPoints ? "Working…" : "Add Points"}
          </button>

          <div style={divider} />

          {/* QUICK EDIT: PLAYER IDs */}
          <div style={{ ...row, marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={label}>Quick Edit — Player IDs</label>
              <button onClick={loadSelectedPlayer} style={smallBtn}>
                {loadingPlayer ? "Loading…" : "Load"}
              </button>
            </div>
          </div>

          <div style={row}>
            <label style={label}>Poker Name/ID</label>
            <input value={pokerId} onChange={(e) => setPokerId(e.target.value)} style={input} />
          </div>

          <div style={row}>
            <label style={label}>Smash Karts Name/ID</label>
            <input value={smashId} onChange={(e) => setSmashId(e.target.value)} style={input} />
          </div>

          <div style={row}>
            <label style={label}>Pudgy Party Name/ID</label>
            <input value={pudgyId} onChange={(e) => setPudgyId(e.target.value)} style={input} />
          </div>

          <button onClick={saveIds} style={btnAction} disabled={busyIds || !selectedUsername}>
            {busyIds ? "Saving…" : "Save IDs"}
          </button>

          {err && <p style={{ color: "#ff8a8a", marginTop: 8 }}>{err}</p>}
          {msg && <p style={{ color: "#8affb1", marginTop: 8 }}>{msg}</p>}
        </div>
      )}
    </>
  );
}
