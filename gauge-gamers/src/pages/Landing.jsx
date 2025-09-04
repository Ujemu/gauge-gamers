import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import RegisterIdentity from "../components/RegisterIdentity";
import NavBar from "../components/NavBar";

export default function Landing() {
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

          {/* Registration card */}
          <RegisterIdentity />

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
