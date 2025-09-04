import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const CURRENT_KEY = "gaugePlayer";
const PLAYERS_KEY = "gaugePlayers";

const loadPlayers = () => {
  try { return JSON.parse(localStorage.getItem(PLAYERS_KEY)) || []; }
  catch { return []; }
};
const savePlayers = (arr) => localStorage.setItem(PLAYERS_KEY, JSON.stringify(arr));
const norm = (s) => (s || "").trim();
const lower = (s) => norm(s).toLowerCase();

export default function RegisterIdentity() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    twitter: "",
    pokerId: "",
    smashId: "",
  });
  const [errors, setErrors] = useState({});
  const [ok, setOk] = useState("");

  function handleChange(e) {
    setOk("");
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    const e = {};
    const u = norm(form.username);
    const x = norm(form.twitter);
    const p = norm(form.pokerId);
    const s = norm(form.smashId);

    if (!u) e.username = "Username is required.";
    if (!x) e.twitter = "X (Twitter) handle is required.";
    if (x && !x.startsWith("@")) e.twitter = "Handle must start with @ (e.g., @web3degen).";
    if (!p && !s) e.game = "Enter Poker ID or Smash Karts ID (at least one).";

    const players = loadPlayers();
    const uL = lower(u), xL = lower(x), pL = lower(p), sL = lower(s);

    if (players.find((pl) => lower(pl.username) === uL)) e.username = "This username is already registered.";
    if (players.find((pl) => lower(pl.twitter) === xL)) e.twitter = "This X handle is already registered.";
    if (p && players.find((pl) => lower(pl.pokerId) === pL)) e.pokerId = "This Poker ID is already registered.";
    if (s && players.find((pl) => lower(pl.smashId) === sL)) e.smashId = "This Smash Karts ID is already registered.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      username: norm(form.username),
      twitter: norm(form.twitter),
      pokerId: norm(form.pokerId),
      smashId: norm(form.smashId),
      savedAt: new Date().toISOString(),
      // init scores so LB can sort
      scores: { smash: 0, poker: 0 },
    };

    try {
      const players = loadPlayers();
      players.push(payload);
      savePlayers(players);

      localStorage.setItem(CURRENT_KEY, JSON.stringify(payload));

      setOk("Saved! Redirecting…");
      navigate("/leaderboard");
    } catch {
      setErrors({ general: "Could not save to localStorage. Check browser settings." });
    }
  }

  const err = (k) => errors[k] ? <div style={msgError}>{errors[k]}</div> : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: 24,
        margin: "24px auto 0",
        maxWidth: 480,
      }}
    >
      <h2 style={{ marginBottom: 16, color: "#fff", fontWeight: 700 }}>
        Register Your Player Identity
      </h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input name="username" value={form.username} onChange={handleChange} placeholder="Username *" style={inputStyle} autoComplete="off" />
        {err("username")}

        <input name="twitter" value={form.twitter} onChange={handleChange} placeholder="X (Twitter) Handle e.g. @web3degen" style={inputStyle} autoComplete="off" />
        {err("twitter")}

        <input name="pokerId" value={form.pokerId} onChange={handleChange} placeholder="Poker ID" style={inputStyle} autoComplete="off" />
        {err("pokerId")}

        <input name="smashId" value={form.smashId} onChange={handleChange} placeholder="Smash Karts ID" style={inputStyle} autoComplete="off" />
        {err("smashId")}
        {err("game")}
        {err("general")}

        <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={buttonStyle}>
          Submit
        </motion.button>

        {ok ? <div style={msgOk}>{ok}</div> : null}
      </form>
    </motion.div>
  );
}

const inputStyle = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  outline: "none",
};

const buttonStyle = {
  marginTop: 12,
  padding: "12px 16px",
  borderRadius: 12,
  background: "#0052FF",
  color: "#fff",
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
};

const msgError = {
  marginTop: -6,
  marginBottom: 6,
  padding: "8px 12px",
  borderRadius: 10,
  background: "rgba(239,68,68,0.15)",
  border: "1px solid rgba(239,68,68,0.35)",
  color: "#fecaca",
  fontSize: 13,
};

const msgOk = {
  marginTop: 6,
  padding: "8px 12px",
  borderRadius: 10,
  background: "rgba(16,185,129,0.15)",
  border: "1px solid rgba(16,185,129,0.35)",
  color: "#bbf7d0",
  fontSize: 13,
};
