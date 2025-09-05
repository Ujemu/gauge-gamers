// src/utils/admin.js

// ---- auth flag (unchanged, for compatibility) ----
export const ADMIN_FLAG = "gauge_admin";

export const isAdmin = () => {
  try { return localStorage.getItem(ADMIN_FLAG) === "true"; }
  catch { return false; }
};

export const setAdmin = (v) => {
  try { localStorage.setItem(ADMIN_FLAG, v ? "true" : "false"); }
  catch {}
};

// ---- PIN sources ----
// Priority: Vercel env (VITE_ADMIN_PIN) > localStorage PIN
const PIN_ENV = (import.meta.env?.VITE_ADMIN_PIN ?? "").toString().trim();
const PIN_KEY = "GG_ADMIN_PIN"; // localStorage key for a device-specific PIN

function getLocalPin() {
  try { return (localStorage.getItem(PIN_KEY) ?? "").toString().trim(); }
  catch { return ""; }
}

/** Returns true if a real PIN exists (env or local). */
export function hasPin() {
  return Boolean(PIN_ENV || getLocalPin());
}

/** Sets a 4-digit local PIN (only if no env PIN is set). */
export function setPin(pin) {
  if (PIN_ENV) {
    return { error: "PIN is set via environment (VITE_ADMIN_PIN). Change it in Vercel → Settings → Environment Variables." };
  }
  const p = String(pin ?? "").replace(/\D/g, "");
  if (!/^\d{4}$/.test(p)) {
    return { error: "PIN must be exactly 4 digits." };
  }
  try { localStorage.setItem(PIN_KEY, p); } catch {}
  return { ok: true };
}

/** Returns where the PIN is coming from: "env" | "local" | "none" */
export function getPinSource() {
  if (PIN_ENV) return "env";
  if (getLocalPin()) return "local";
  return "none";
}

/** Back-compat helper: returns the effective PIN (env > local > '0000'). */
export const getEnvPin = () => {
  const pin = PIN_ENV || getLocalPin() || "0000";
  return pin;
};

/** Validates a 4-digit PIN against env/local (default '0000' if none set). */
export function checkPin(pin) {
  const entered = String(pin ?? "").replace(/\D/g, "");
  if (entered.length !== 4) return false;
  const actual = PIN_ENV || getLocalPin() || "0000";
  return entered === actual;
}
