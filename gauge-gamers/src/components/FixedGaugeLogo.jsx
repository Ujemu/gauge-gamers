import React from "react";
import gaugeLogo from "../assets/gauge-logo.png"; // <-- PNG here too

export default function FixedGaugeLogo({ hidden = false }) {
  if (hidden) return null;
  return (
    <div style={wrap}>
      <img src={gaugeLogo} alt="Gauge logo" style={img} />
    </div>
  );
}

const wrap = { position: "fixed", left: 16, top: 16, zIndex: 50 };
const img  = { width: 28, height: 28, borderRadius: 6 };
