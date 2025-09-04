import React from "react";
import { motion } from "framer-motion";

const tabBtn = (active) => ({
  position: "relative",
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: active ? "rgba(255,255,255,0.06)" : "transparent",
  color: active ? "#fff" : "#cbd5e1",
  fontWeight: 700,
  cursor: "pointer",
  userSelect: "none",
});

export default function Tabs({ value, onChange }) {
  const tabs = [
    { key: "smash", label: "Smash Karts" },
    { key: "poker", label: "Poker" },
  ];

  return (
    <div style={{ display: "inline-flex", gap: 10 }}>
      {tabs.map((t) => {
        const active = value === t.key;
        return (
          <div key={t.key} onClick={() => onChange(t.key)} style={tabBtn(active)}>
            {t.label}
            {active && (
              <motion.div
                layoutId="gauge-tabs-underline"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                style={{
                  position: "absolute",
                  left: 8,
                  right: 8,
                  bottom: -6,
                  height: 3,
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #0052FF, #ef4444)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
