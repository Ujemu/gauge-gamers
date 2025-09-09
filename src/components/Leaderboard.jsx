import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchLeaderboard } from "../lib/supabaseClient";
import ScorePanel from "../components/ScorePanel";

const CURRENT_KEY = "gaugePlayer"; // used only to highlight "you"

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

export default function LeaderboardPage() {
  const [me, setMe] = useState(null);
  const [activeTab, setActiveTab] = useState("smash"); // "smash" | "poker" | "pudgy"
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load "me" only for row highlight
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CURRENT_KEY);
      if (raw) setMe(JSON.parse(raw));
    } catch {}
  }, []);

  // Single loader used by page and by ScorePanel's onChange
  async function loadLeaderboardFor(game = activeTab) {
    setLoading(true);
    const { data, error } = await fetchLeaderboard(game);
    if (!error) setPlayers(data || []);
    setLoading(false);
  }

  // Load whenever tab changes
  useEffect(() => {
    loadLeaderboardFor(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const metricName =
    activeTab === "smash" ? "Points" :
    activeTab === "poker" ? "Chips" : "Points";

  const getScore = (p) =>
    activeTab === "smash" ? p.score_smash ?? 0 :
    activeTab === "poker" ? p.score_poker ?? 0 :
    p.score_pudgy ?? 0;

  return (
    <>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab("smash")}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: activeTab==="smash"?"rgba(0,82,255,0.18)":"transparent", color:"#e5e7eb" }}
        >
          Smash Karts
        </button>
        <button
          onClick={() => setActiveTab("poker")}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: activeTab==="poker"?"rgba(0,82,255,0.18)":"transparent", color:"#e5e7eb" }}
        >
          Poker
        </button>
        <button
          onClick={() => setActiveTab("pudgy")}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: activeTab==="pudgy"?"rgba(0,82,255,0.18)":"transparent", color:"#e5e7eb" }}
        >
          Pudgy Party
        </button>
      </div>

      {/* Leaderboard Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{ ...baseCard, marginTop: 8 }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <h2 style={{ margin: 0 }}>
            {activeTab === "smash" ? "Smash Karts" : activeTab === "poker" ? "Poker" : "Pudgy Party"} Leaderboard
          </h2>
          <span style={{ color: "#94a3b8", fontSize: 13 }}>
            (updates instantly after admin adds points)
          </span>
        </div>

        <div style={headRow}>
          <div>#</div>
          <div>Player</div>
          <div style={{ textAlign: "right" }}>{metricName}</div>
        </div>

        {loading ? (
          <div style={{ padding: 16, textAlign: "center", color: "#94a3b8" }}>Loading…</div>
        ) : players.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center", color: "#94a3b8" }}>
            No players yet — register and get your first points!
          </div>
        ) : (
          players.map((p, i) => {
            const rank = i + 1;
            const isYou = me?.username && lower(p.username) === lower(me.username);
            const value = getScore(p);

            return (
              <motion.div
                key={`${p.username}-${rank}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: i * 0.02 }}
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
                    {p.username}
                    {isYou && " (you)"}
                  </span>
                  {p.twitter ? (
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>{p.twitter}</span>
                  ) : null}
                </div>

                <div style={{ textAlign: "right", fontWeight: 700 }}>{value}</div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Admin panel — bound to the current tab */}
      <ScorePanel
        currentGame={activeTab}
        onChange={(game) => loadLeaderboardFor(game)}
      />
    </>
  );
}
