import React from "react";
import { Link, useLocation } from "react-router-dom";
import GaugeBadge from "./GaugeBadge"; // import your badge

export default function NavBar() {
  const { pathname } = useLocation();

  const link = (to, label) => (
    <Link
      to={to}
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        color: "#e5e7eb",
        textDecoration: "none",
        fontWeight: 700,
        border:
          pathname === to
            ? "2px solid rgba(59,130,246,0.7)"
            : "2px solid rgba(255,255,255,0.12)",
        background:
          pathname === to ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.06)",
        backdropFilter: "blur(6px)",
      }}
    >
      {label}
    </Link>
  );

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between", // badge left, links right
        padding: 16,
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0))",
      }}
    >
      {/* Left side: Gauge Gamers badge */}
      <GaugeBadge />

      {/* Right side: nav links */}
      <div style={{ display: "flex", gap: 12 }}>
        {link("/", "Register")}
        {link("/leaderboard", "Leaderboard")}
      </div>
    </div>
  );
}
