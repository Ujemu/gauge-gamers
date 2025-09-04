// src/components/ScorePanel.jsx
import React, { useState } from "react";
import { isAdmin, setAdmin, hasPin, setPin, checkPin } from "../utils/admin";
import {
  adminFetchPlayer,
  adminIncScore,
  adminUpdateIds,
} from "../lib/supabaseClient";

/* ---- styles from your existing panel (kept) ---- */
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
const divider = { height: 1, background: "rgba(255,255,255,0.12)", margin: "10px 0" };

export default function ScorePanel({ onChange }) {
  const [open, setOpen] = useState(false);
  const [authorized, setAuthorized] = useState(isAdmin());

  // PIN creation/unlock (4-digit)
  const [pinCreate, setPinCreate] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  // points state
  const [handleForPoints, setHandleForPoints] = useState(""); // X handle (no @)
  const [game, setGame] = useState("smash"); // "smash" | "poker" | "pudgy"
  const [points, setPoints] = useState(0);
  const [busyPoints, setBusyPoints] = useState(false);

  // quick edit IDs
  const [handleForIds, setHandleForIds] = useState(""); // X handle (no @)
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [player, setPlayer] = useState(null);
  const [pokerId, setPokerId] = useState("");
  const [smashId, setSmashId] = useState("");
  const [pudgyId, setPudgyId] = useState("");
  const [busyIds, setBusyIds] = useState(false);

  // feedback
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);

  function resetFeedback() { setErr(null); setMsg(null); }

  const handleToggle = () => {
    if (!authorized) {
      // If no PIN exists yet, allow creating a local 4-digit PIN (unless env PIN is set)
      if (!hasPin()) {
        const p1 = window.prompt("Create 4-digit Admin PIN (digits only)");
        const p2 = window.prompt("Confirm PIN");
        if (p1 && p2 && p1 === p2) {
          const res = setPin(String(p1).replace(/\D/g, "").slice(0,4));
          if (res?.error) {
            alert(res.error);
          } else {
            alert("PIN saved. Click Admin again and enter the PIN to unlock.");
          }
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

  // Apply points delta via Supabase
  async function addScore() {
    resetFeedback();
    const u = (handleForPoints || "").trim().replace(/^@+/, "");
    const delta = Number(points || 0);
    if (!u) { setErr("Enter X handle (no @) for Points."); return; }
    if (!delta) { setErr("Enter a non-zero delta."); return; }
    setBusyPoints(true);
    const { error } = await adminIncScore({ username: u, game, delta });
    setBusyPoints(false);
    if (error) { setErr(error.message || "Failed to update score"); return; }
    setMsg("Score updated ✓");
    setPoints(0);
    onChange?.();
  }

  // Load player for IDs
  async function loadPlayer() {
    resetFeedback();
    const u = (handleForIds || "").trim().replace(/^@+/, "");
    if (!u) { setErr("Enter X handle (no @) to load IDs."); return; }
    setLoadingPlayer(true);
    const { data, error } = await adminFetchPlayer(u);
    setLoadingPlayer(false);
    if (error) { setErr(error.message || "Not found"); setPlayer(null); return; }
    setPlayer(data || null);
    setPokerId(data?.poker_id || "");
    setSmashId(data?.smash_id || "");
    setPudgyId(data?.pudgy_party_id || "");
    if (!data) setErr("No player with that handle.");
  }

  // Save IDs via Supabase
  async function saveIds() {
    resetFeedback();
    if (!player?.username) { setErr("Load a player first."); return; }
    setBusyIds(true);
    const { error } = await adminUpdateIds(player.username, {
      pokerId: pokerId.trim() || null,
      smashId: smashId.trim() || null,
      pudgyPartyId: pudgyId.trim() || null,
    });
    setBusyIds(false);
    if (error) { setErr(error.message || "Failed to update IDs"); return; }
    setMsg("Player IDs updated ✓");
    onChange?.();
  }

  return (
    <>
      {/* visible to everyone; opens only with PIN */}
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
            <strong>Admin</strong>
            <button onClick={logoutAdmin} style={linkBtn}>Sign out</button>
          </div>

          {/* POINTS */}
          <div style={row}>
            <label style={label}>X Handle for Points (no @)</label>
            <input
              value={handleForPoints}
              onChange={(e) => setHandleForPoints(e.target.value)}
              placeholder="e.g. Kings_webx"
              style={input}
            />
          </div>

          <div style={row}>
            <label style={label}>Game</label>
            <select value={game} onChange={(e) => setGame(e.target.value)} style={input}>
              <option value="smash">Smash Karts</option>
              <option value="poker">Poker</option>
              <option value="pudgy">Pudgy Party</option>
            </select>
          </div>

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
            {busyPoints ? "Working…" : "Apply Points"}
          </button>

          <div style={divider} />

          {/* QUICK EDIT: PLAYER IDs */}
          <div style={row}>
            <label style={label}>X Handle for IDs (no @)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={handleForIds}
                onChange={(e) => setHandleForIds(e.target.value)}
                placeholder="e.g. Kings_webx"
                style={{ ...input, flex: 1 }}
              />
              <button onClick={loadPlayer} style={{ ...btnAction, width: 110 }}>
                {loadingPlayer ? "Loading…" : "Load"}
              </button>
            </div>
          </div>

          <div style={row}>
            <label style={label}>Poker Name/ID</label>
            <input
              value={pokerId}
              onChange={(e) => setPokerId(e.target.value)}
              placeholder="optional"
              style={input}
            />
          </div>

          <div style={row}>
            <label style={label}>Smash Karts Name/ID</label>
            <input
              value={smashId}
              onChange={(e) => setSmashId(e.target.value)}
              placeholder="optional"
              style={input}
            />
          </div>

          <div style={row}>
            <label style={label}>Pudgy Party Name/ID</label>
            <input
              value={pudgyId}
              onChange={(e) => setPudgyId(e.target.value)}
              placeholder="optional"
              style={input}
            />
          </div>

          <button onClick={saveIds} style={btnAction} disabled={busyIds || !player}>
            {busyIds ? "Saving…" : "Save IDs"}
          </button>

          {/* feedback */}
          {err && <p style={{ color: "#ff8a8a", marginTop: 8 }}>{err}</p>}
          {msg && <p style={{ color: "#8affb1", marginTop: 8 }}>{msg}</p>}
        </div>
      )}
    </>
  );
}
