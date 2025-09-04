import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const CURRENT_KEY = "gaugePlayer";   // last signed-in player
const PLAYERS_KEY = "gaugePlayers";  // array of all registered players

const baseCard = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 16,
  padding: 16,
};

const headRow = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "70px 1fr 130px",
  gap: 8,
  padding: "8px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  color: "#94a3b8",
  fontWeight: 700,
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "70px 1fr 130px",
  gap: 8,
  padding: "10px 12px",
  alignItems: "center",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const medal = (rank) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null);
const lower = (s) => (s || "").toString().trim().toLowerCase();

export default function Leaderboard({ game }) {
  const [me, setMe] = useState(null);
  const [players, setPlayers] = useState([]);

  // Load current user + all players
  useEffect(() => {
    try {
      const rawMe = localStorage.getItem(CURRENT_KEY);
      if (rawMe) setMe(JSON.parse(rawMe));
    } catch {}
    try {
      const rawAll = localStorage.getItem(PLAYERS_KEY);
      setPlayers(rawAll ? JSON.parse(rawAll) : []);
    } catch {
      setPlayers([]);
    }
  }, []);

  // Registered players for the selected game only
  const rows = useMemo(() => {
    const list = (players || [])
      .filter((p) => (game === "smash" ? !!p?.smashId?.trim() : !!p?.pokerId?.trim()))
      .map((p) => ({
        player: p.username || "Unknown",
        _twitter: p.twitter || "",
        points: game === "smash" ? 0 : undefined,
        chips: game === "poker" ? 0 : undefined,
      }));

    // sort by metric (future-proof)
    list.sort((a, b) =>
      game === "smash" ? (b.points ?? 0) - (a.points ?? 0) : (b.chips ?? 0) - (a.chips ?? 0)
    );

    return list;
  }, [players, game]);

  const metricName = game === "smash" ? "Points" : "Chips";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ ...baseCard, marginTop: 20 }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <h2 style={{ margin: 0 }}>
          {game === "smash" ? "Smash Karts" : "Poker"} Leaderboard
        </h2>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>
          (players appear after registering)
        </span>
      </div>

      <div style={headRow}>
        <div>#</div>
        <div>Player</div>
        <div style={{ textAlign: "right" }}>{metricName}</div>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: 16, textAlign: "center", color: "#94a3b8" }}>
          No players yet — be the first to register!
        </div>
      ) : (
        rows.map((row, i) => {
          const rank = i + 1;
          const isYou = me?.username && lower(row.player) === lower(me.username);
          const value = game === "smash" ? (row.points ?? 0) : (row.chips ?? 0);
          const twitter = isYou ? me?.twitter : row?._twitter;

          return (
            <motion.div
              key={`${row.player}-${rank}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: i * 0.03 }}
              style={{
                ...rowStyle,
                background: isYou ? "rgba(0,82,255,0.08)" : "transparent",
                borderLeft: isYou ? "3px solid #0052FF" : "3px solid transparent",
                borderRadius: 10,
                marginTop: 6,
              }}
            >
              <div style={{ fontWeight: 800 }}>
                {medal(rank) ? medal(rank) : `#${rank}`}
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 700 }}>
                  {row.player}
                  {isYou && " (you)"}
                </span>
                {twitter ? (
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>{twitter}</span>
                ) : null}
              </div>

              <div style={{ textAlign: "right", fontWeight: 700 }}>{value}</div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
}
