import React, { useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import ScorePanel from "../components/ScorePanel"; // keep if you already added it
import { fetchLeaderboard } from "../lib/supabaseClient";

const GAME_CONFIG = {
  smash: { title: "Smash Karts", idKey: "smash_id",  scoreKey: "score_smash",  scoreLabel: "Points" },
  poker: { title: "Poker",       idKey: "poker_id",  scoreKey: "score_poker",  scoreLabel: "Chips"  },
  pudgy: { title: "Pudgy Party", idKey: "pudgy_party_id", scoreKey: "score_pudgy", scoreLabel: "Points" },
};

export default function LeaderboardPage() {
  const [game, setGame] = useState("smash"); // "smash" | "poker" | "pudgy"
  const [tick, setTick] = useState(0);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await fetchLeaderboard(); // shared DB
      if (!alive) return;
      if (error) {
        setErr(error.message || "Failed to load leaderboard");
        setPlayers([]);
      } else {
        setPlayers(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [tick]); // refetch when ScorePanel triggers onChange

  // ✅ Only include players who registered for the selected game, show proper ID & score
  const rows = useMemo(() => {
    const { idKey, scoreKey } = GAME_CONFIG[game];
    const eligible = players.filter(p => !!p?.[idKey]);

    eligible.sort((a, b) => {
      const aScore = a?.[scoreKey] ?? 0;
      const bScore = b?.[scoreKey] ?? 0;
      return bScore - aScore;
    });

    return eligible;
  }, [players, game]);

  const { title, scoreLabel, idKey, scoreKey } = GAME_CONFIG[game];

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
          <Tab active={game === "pudgy"} onClick={() => setGame("pudgy")}>Pudgy Party</Tab>
        </div>

        <div style={card}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
            <h3 style={{ color: "#fff", margin: 0, fontWeight: 800 }}>
              {title} Leaderboard
            </h3>
          </div>

          {/* Header */}
          <div style={thead}>
            <div style={{ width: 52 }}>#</div>
            <div style={{ flex: 1 }}>Player ID</div>
            <div style={{ width: 200 }}>X Handle</div>
            <div style={{ width: 120, textAlign: "right" }}>{scoreLabel}</div>
          </div>

          {/* Rows */}
          {loading && (
            <div style={{ color: "#94a3b8", padding: "10px 12px" }}>Loading…</div>
          )}

          {!loading && err && (
            <div style={{ color: "#ff8a8a", padding: "10px 12px" }}>{err}</div>
          )}

          {!loading && !err && rows.length === 0 && (
            <div style={{ color: "#94a3b8", padding: "10px 12px" }}>
              No players yet for this game — register to appear here.
            </div>
          )}

          {!loading && !err && rows.length > 0 && rows.map((p, idx) => {
            const score = p?.[scoreKey] ?? 0;
            const idValue = p?.[idKey] || "—";
            const xHandle = p?.twitter || (p?.username ? `@${p.username}` : "—");
            return (
              <div key={p.username ?? idx} style={trow(idx)}>
                <div style={{ width: 52 }}>
                  {idx < 3 ? <Medal rank={idx + 1} /> : `#${idx + 1}`}
                </div>
                <div style={{ flex: 1, fontWeight: 700, color: "#e5e7eb" }}>
                  {idValue}
                </div>
                <div style={{ width: 200, color: "#cbd5e1", fontWeight: 600 }}>
                  {xHandle}
                </div>
                <div style={{ width: 120, textAlign: "right", fontWeight: 800, color: "#fff" }}>
                  {score}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keep this to trigger a refetch after any score changes */}
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
