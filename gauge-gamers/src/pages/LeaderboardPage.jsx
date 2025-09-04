import React, { useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import ScorePanel from "../components/ScorePanel"; // keep if you already added it

const PLAYERS_KEY = "gaugePlayers";

function loadPlayers() {
  try { return JSON.parse(localStorage.getItem(PLAYERS_KEY)) || []; }
  catch { return []; }
}
const safeScore = (p, game) => (p?.scores?.[game] ?? 0);

export default function LeaderboardPage() {
  const [game, setGame] = useState("poker"); // "poker" | "smash"
  const [tick, setTick] = useState(0);
  const [players, setPlayers] = useState([]);

  useEffect(() => { setPlayers(loadPlayers()); }, [tick]);

  const rows = useMemo(() => {
    const arr = players.slice();
    arr.sort((a, b) => safeScore(b, game) - safeScore(a, game));
    return arr;
  }, [players, game]);

  const scoreLabel = game === "poker" ? "Chips" : "Points";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar />

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 16px 64px" }}>
        <h1 style={{ color: "#fff", margin: "8px 0 18px", fontWeight: 900, fontSize: 36 }}>
          Gauge Gamers — Leaderboard
        </h1>

        <div style={{ display: "inline-flex", gap: 10, marginBottom: 16 }}>
          <Tab active={game === "smash"} onClick={() => setGame("smash")}>Smash Karts</Tab>
          <Tab active={game === "poker"} onClick={() => setGame("poker")}>Poker</Tab>
        </div>

        <div style={card}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
            <h3 style={{ color: "#fff", margin: 0, fontWeight: 800 }}>
              {game === "poker" ? "Poker Leaderboard" : "Smash Karts Leaderboard"}
            </h3>
          </div>

          {/* Header */}
          <div style={thead}>
            <div style={{ width: 52 }}>#</div>
            <div style={{ flex: 1 }}>Player</div>
            <div style={{ width: 120, textAlign: "right" }}>{scoreLabel}</div>
          </div>

          {/* Rows (only registered players) */}
          {rows.length ? rows.map((p, idx) => (
            <div key={(p.twitter || p.username || "p") + idx} style={trow(idx)}>
              <div style={{ width: 52 }}>
                {idx < 3 ? <Medal rank={idx + 1} /> : `#${idx + 1}`}
              </div>
              <div style={{ flex: 1, fontWeight: 700, color: "#e5e7eb" }}>
                {p?.username || p?.twitter || "Player"}
              </div>
              <div style={{ width: 120, textAlign: "right", fontWeight: 800, color: "#fff" }}>
                {safeScore(p, game)}
              </div>
            </div>
          )) : (
            <div style={{ color: "#94a3b8", padding: "10px 12px" }}>
              No players yet — register to appear here.
            </div>
          )}
        </div>
      </div>

      {/* floating Add Score panel; remove if you don't want it visible here */}
      <ScorePanel onChange={() => setTick(t => t + 1)} />
    </div>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.15)",
        background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
        color: "#e5e7eb",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {children}
      {active && (
        <span
          style={{
            position: "absolute",
            left: 10, right: 10, bottom: -2, height: 3, borderRadius: 3,
            background: "linear-gradient(90deg, rgb(59,130,246), rgb(236,72,153))",
          }}
        />
      )}
    </button>
  );
}

function Medal({ rank }) {
  const emoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  return <span style={{ fontSize: 20 }}>{emoji}</span>;
}

const card = {
  padding: 16,
  borderRadius: 18,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
};

const thead = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#cbd5e1",
  fontWeight: 800,
  marginBottom: 8,
};

const trow = () => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 8,
});
