// src/utils/admin.js
export const ADMIN_FLAG = "gauge_admin";

export const isAdmin = () => {
  try { return localStorage.getItem(ADMIN_FLAG) === "true"; } catch { return false; }
};

export const setAdmin = (v) => {
  try { localStorage.setItem(ADMIN_FLAG, v ? "true" : "false"); } catch {}
};

// Read PIN from .env (preferred). If missing, allow a localStorage override.
// This guarantees the PIN gate works NOW even if env isn't loading yet.
export const getEnvPin = () => {
  const envPin = (import.meta.env?.VITE_ADMIN_PIN ?? "").toString().trim();
  const lsOverride = (localStorage.getItem("VITE_ADMIN_PIN") ?? "").toString().trim();
  const pin = envPin || lsOverride || "0000";
  console.log("[Admin] PIN source:", envPin ? ".env" : (lsOverride ? "localStorage" : "default 0000"));
  return pin;
};

export const checkPin = (pin) =>
  (pin ?? "").toString().trim() === getEnvPin();
