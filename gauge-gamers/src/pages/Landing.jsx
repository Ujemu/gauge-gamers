import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { upsertPlayer } from "../lib/supabaseClient";

export default function Landing() {
  const navigate = useNavigate();

  // form state (replaces localStorage-only behavior)
  const [username, setUsername] = useState("");
  const [twitter, setTwitter] = useState("");
  const [pokerId, setPokerId] = useState("");
  const [smashId, setSmashId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const u = username.trim();
    if (!u) {
      setErr("Username is required.");
      return;
    }

    setSubmitting(true);
    const { error } = await upsertPlayer({
      username: u,
      twitter: twitter.trim() || null,
      pokerId: pokerId.trim() || null,
      smashId: smashId.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      // duplicate username -> unique constraint
      if (error.code === "23505" || /duplicate/i.test(error.message)) {
        setErr("That username is already registered. Pick another.");
      } else {
        setErr(error.message || "Something went wrong. Please try again.");
      }
      return;
    }

    setMsg("Registered! Redirecting to the leaderboard…");
    setTimeout(() => navigate("/leaderboard"), 800);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top navigation (contains the single Gauge Gamers badge) */}
      <NavBar />

      {/* Page content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: 24,
        }}
      >
        <div style={{ width: "100%", maxWidth: 960 }}>
          {/* Subtitle pill only */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={pillSub}
          >
            <span
              style={{
                fontFamily:
                  '"PT Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              }}
            >
              Register once to appear on the leaderboard.
            </span>
          </motion.div>

          {/* Registration card (now saves to Supabase) */}
          <div
            className="card"
            style={{
              padding: 20,
              borderRadius: 16,
              backdropFilter: "blur(4px)",
            }}
          >
            <h2 style={{ margin: "4px 0 12px 0" }}>Register Your Player Identity</h2>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
              <input
                className="card"
                placeholder="Username *"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ padding: 12, borderRadius: 12, border: "none" }}
              />
              <input
                className="card"
                placeholder="X (Twitter) Handle e.g. @web3degen"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                style={{ padding: 12, borderRadius: 12, border: "none" }}
              />
              <input
                className="card"
                placeholder="Poker ID"
                value={pokerId}
                onChange={(e) => setPokerId(e.target.value)}
                style={{ padding: 12, borderRadius: 12, border: "none" }}
              />
              <input
                className="card"
                placeholder="Smash Karts ID"
                value={smashId}
                onChange={(e) => setSmashId(e.target.value)}
                style={{ padding: 12, borderRadius: 12, border: "none" }}
              />

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "none",
                  fontWeight: 800,
                  cursor: submitting ? "not-allowed" : "pointer",
                  background:
                    "linear-gradient(90deg, rgb(59,130,246) 0%, rgb(236,72,153) 100%)",
                  color: "#fff",
                }}
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </form>

            {err && (
              <p style={{ color: "#ff8a8a", marginTop: 12 }}>
                {err}
              </p>
            )}
            {msg && (
              <p style={{ color: "#8affb1", marginTop: 12 }}>
                {msg}
              </p>
            )}
          </div>

          {/* Big CTA pill */}
          <div style={{ marginTop: 20 }}>
            <Link to="/leaderboard" style={pillCta}>
              <span
                style={{
                  fontFamily:
                    '"PT Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                }}
              >
                Already registered? View Leaderboard →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- styles ---- */
const gradient = "linear-gradient(90deg, rgb(59,130,246) 0%, rgb(236,72,153) 100%)";

const pillBase = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 20,
  padding: "12px 18px",
  boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#fff",
  background: gradient,
};

const pillSub = { ...pillBase, marginBottom: 14 };
const pillCta = { ...pillBase, fontWeight: 800, textDecoration: "none" };
