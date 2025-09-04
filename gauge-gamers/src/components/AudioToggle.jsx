import React, { useEffect, useRef, useState } from "react";

const LS_KEY = "gauge_audio_enabled";     // remember choice

export default function AudioToggle({
  src = "/assets/bg-music.mp3",           // served from public/
  volume = 0.5,
  bottom = 18,
  right = 18,
  defaultEnabled = true,                  // try to start ON by default
}) {
  const audioRef = useRef(null);

  // use saved choice if present, otherwise defaultEnabled
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? saved === "true" : defaultEnabled;
  });

  // Try to play right away; if blocked by autoplay policy,
  // start on the first user interaction (click/tap/key).
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;

    const attemptPlay = () =>
      a.play().catch(() => {
        // Autoplay blocked—will wait for user gesture
      });

    // keep LS in sync
    localStorage.setItem(LS_KEY, String(enabled));

    if (enabled) {
      attemptPlay();

      const unlock = () => {
        a.play().catch(() => {}); // try again after gesture
        cleanup();
      };
      const cleanup = () => {
        document.removeEventListener("pointerdown", unlock);
        document.removeEventListener("keydown", unlock);
        document.removeEventListener("touchstart", unlock);
      };

      // if autoplay was blocked, any of these will unlock it
      document.addEventListener("pointerdown", unlock, { once: true });
      document.addEventListener("keydown", unlock, { once: true });
      document.addEventListener("touchstart", unlock, { once: true });

      return cleanup;
    } else {
      a.pause();
    }
  }, [enabled, volume]);

  return (
    <>
      {/* the audio element */}
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="auto"
        autoPlay // ask the browser to autoplay (may be blocked)
      />

      {/* floating speaker button */}
      <button
        onClick={() => setEnabled((v) => !v)}
        aria-label={enabled ? "Mute music" : "Play music"}
        title={enabled ? "Mute music" : "Play music"}
        style={{
          position: "fixed",
          bottom,
          right,
          zIndex: 60,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.18)",
          background: enabled
            ? "linear-gradient(90deg, rgb(59,130,246), rgb(236,72,153))"
            : "rgba(255,255,255,0.08)",
          boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        {enabled ? (
          // speaker with waves (ON)
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
            <path d="M16 8a5 5 0 010 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18.5 6.5a8 8 0 010 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".7"/>
          </svg>
        ) : (
          // speaker with X (OFF)
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
            <path d="M19 9l-6 6M13 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </>
  );
}
