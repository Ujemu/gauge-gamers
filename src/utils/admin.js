// src/utils/admin.js

// IMPORTANT: This PIN is a build-time env var.
// Anyone who knows it can unlock the Admin panel.
// Set it in .env (local) and in Vercel → Settings → Environment Variables.
const SHARED_PIN = (import.meta.env.VITE_ADMIN_PIN || "").trim();

// Session flag so you don't re-enter the PIN on every click
const ADMIN_FLAG_KEY = "gg_admin_unlocked";

// --- public API ---

export function isAdmin() {
  try {
    return sessionStorage.getItem(ADMIN_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdmin(enabled) {
  try {
    if (enabled) {
      sessionStorage.setItem(ADMIN_FLAG_KEY, "1");
    } else {
      sessionStorage.removeItem(ADMIN_FLAG_KEY);
    }
  } catch {}
}

export function hasPin() {
  return SHARED_PIN.length > 0;
}

export function checkPin(input) {
  if (!hasPin()) return false;
  const normalized = String(input || "").trim();
  return normalized === SHARED_PIN;
}

// No-ops kept for backward compatibility with your codebase
export function setPin() {
  console.warn("[admin] setPin() ignored — using shared VITE_ADMIN_PIN");
  return { error: null };
}
