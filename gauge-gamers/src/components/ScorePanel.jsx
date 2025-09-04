import React, { useMemo, useState } from "react";
import { isAdmin, setAdmin, checkPin } from "../utils/admin";


const PLAYERS_KEY = "gaugePlayers";

function loadPlayers() {
  try { return JSON.parse(localStorage.getItem(PLAYERS_KEY)) || []; }
  catch { return []; }
}
function savePlayers(arr) {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(arr));
}
const safeScore = (p, game) => (p?.scores?.[game] ?? 0);

export default function ScorePanel({ onChange }) {
  const [open, setOpen] = useState(false);
  const [authorized, setAuthorized] = useState(isAdmin());
  const [playerKey, setPlayerKey] = useState(""); // use twitter as key
  const [game, setGame] = useState("poker");      // "poker" | "smash"
  const [points, setPoints] = useState(0);

  const players = useMemo(() => loadPlayers(), [open]); // refresh when opening

  const handleToggle = () => {
    if (!authorized) {
      const pin = window.prompt("Admin PIN required to edit scores");
      if (pin && checkPin(pin)) {
        setAdmin(true);
        setAuthorized(true);
        setOpen(true);
        alert("Admin access granted.");
      } else if (pin != null) {
        alert("Invalid PIN");
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

  const addScore = () => {
    const pts = Number(points) || 0;
    if (!playerKey || !pts) return;

    const arr = loadPlayers();
    const idx = arr.findIndex(
      (p) => (p.twitter || "").toLowerCase() === playerKey.toLowerCase()
    );
    if (idx === -1) return;

    const cur = arr[idx];
    if (!cur.scores) cur.scores = { smash: 0, poker: 0 };
    cur.scores[game] = safeScore(cur, game) + pts;

    savePlayers(arr);
    setPoints(0);
    if (onChange) onChange();
  };

  return (
    <>
      {/* visible to everyone; opens only with PIN */}
      <button
        onClick={handleToggle}
        style={btnToggle(authorized)}
        title={authorized ? "Open score panel" : "Admin (PIN required)"}
      >
        {authorized ? "Admin ✓" : "Admin"}
      </button>

      {open && authorized && (
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Score Admin</strong>
            <button onClick={logoutAdmin} style={linkBtn}>Sign out</button>
          </div>

          <div style={row}>
            <label style={label}>Player (Twitter)</label>
            <select
              value={playerKey}
              onChange={(e) => setPlayerKey(e.target.value)}
              style={input}
            >
              <option value="">Select player</option>
              {players.map((p) => (
                <option key={(p.twitter || p.username) ?? Math.random()}
                        value={(p.twitter || "").toLowerCase()}>
                  {(p.username || "Player")} — {p.twitter || "no-twitter"}
                </option>
              ))}
            </select>
          </div>

          <div style={row}>
            <label style={label}>Game</label>
            <select value={game} onChange={(e) => setGame(e.target.value)} style={input}>
              <option value="poker">Poker</option>
              <option value="smash">Smash Karts</option>
            </select>
          </div>

          <div style={row}>
            <label style={label}>Points/Chips</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="e.g., 50"
              style={input}
            />
          </div>

          <button onClick={addScore} style={btnAction}>Add Points</button>
        </div>
      )}
    </>
  );
}

/* ---- styles ---- */
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
  width: 300,
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

const linkBtn = {
  appearance: "none",
  background: "transparent",
  border: "none",
  color: "#93c5fd",
  cursor: "pointer",
  fontWeight: 700,
};
