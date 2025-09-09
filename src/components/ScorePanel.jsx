// src/components/ScorePanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { isAdmin, setAdmin, hasPin, checkPin } from "../utils/admin";
import {
  adminFetchPlayer,
  adminIncScore,
  adminUpdateIds,
  fetchPlayersForGame, // <-- use server-side filtered list
} from "../lib/supabaseClient";

/* ---------- helpers ---------- */
const stripAt = (s) => (s || "").trim().replace(/^@+/, "");
const normHandle = stripAt;

/* ---------- styles ---------- */
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
export default function ScorePanel({ currentGame = "smash", onChange }) {
  const [open, setOpen] = useState(false);
  const [authorized, setAuthorized] = useState(isAdmin());

  // game + list
  const [game, setGame] = useState(currentGame); // follow parent tab
  const [listLoading, setListLoading] = useState(false);
  const [listErr, setListErr] = useState(null);
  const [playersByGame, setPlayersByGame] = useState([]); // [{value, label}]

  // selection / points
  const [selectedUsername, setSelectedUsername] = useState(""); // username or twitter (no @)
  const [points, setPoints] = useState(10); // default to non-zero
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

  // keep panel game in sync with page tab
  useEffect(() => { setGame(currentGame); }, [currentGame]);

  /* --- auth toggle with PIN --- */
  const handleToggle = () => {
    if (!authorized) {
      if (!hasPin()) {
        alert("Admin PIN is not configured. Set VITE_ADMIN_PIN in your env.");
        return;
      }
      const pin = window.prompt("Enter Admin PIN");
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

  /* --- fetch ONLY players for current game (server filtered) --- */
  async function loadPlayersForGame() {
    setListErr(null);
    setListLoading(true);
    try {
      const { data, error } = await fetchPlayersForGame(game);
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];

      // Build safe options: prefer username; fallback to twitter (no @). Drop rows with neither.
      const mapped = rows
        .map((p) => {
          const uname = (p.username || "").trim();
          const tw = (p.twitter || "").trim().replace(/^@+/, "");
          const value = uname || tw;
          if (!value) return null;
          const label = `${uname || tw}${p.twitter ? ` — ${p.twitter}` : ""}`;
          return { value, label };
        })
        .filter(Boolean);

      mapped.sort((a, b) => (a.value || "").localeCompare(b.value || ""));
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
    setSelectedUsername("");
  }, [open, authorized, game]);

  // when changing selected player, clear the ID editors
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
    const delta = Number(points);

    if (!u) { setErr("Pick a player first."); return; }
    if (!Number.isFinite(delta) || delta === 0) { setErr("Enter a non-zero delta."); return; }

    setBusyPoints(true);
    const { error } = await adminIncScore({ username: u, game, delta });
    setBusyPoints(false);

    if (error) { setErr(error.message || "Failed to update score"); return; }

    setMsg("Score updated ✓");
    setPoints(10); // reset to non-zero

    // 🔁 refresh the leaderboard immediately
    if (typeof onChange === "function") {
      onChange(game);
    } else {
      setTimeout(() => window.location.reload(), 300);
    }
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

    if (typeof onChange === "function") onChange(game);
  }

  /* --- dropdown options --- */
  const options = useMemo(() => playersByGame, [playersByGame]);

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

          {/* GAME (follows the page tab, but still changeable) */}
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

          {/* PLAYERS */}
          <div style={row}>
            <label style={label}>
              Player — {listLoading ? "loading…" : listErr ? "error" : `${options.length} found`}
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
              onChange={(e) => setPoints(Number(e.target.value))}
              placeholder="e.g., 50"
              style={input}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={smallBtn} onClick={() => setPoints((p) => Number(p) + 10)}>+10</button>
              <button style={smallBtn} onClick={() => setPoints((p) => Number(p) + 50)}>+50</button>
              <button style={smallBtn} onClick={() => setPoints((p) => Number(p) - 10)}>-10</button>
              <button style={smallBtn} onClick={() => setPoints(10)}>Reset 10</button>
            </div>
          </div>

          <button
            onClick={addScore}
            style={btnAction}
            disabled={busyPoints || !selectedUsername || !Number.isFinite(points) || Number(points) === 0}
          >
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
