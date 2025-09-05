import { useEffect, useMemo, useRef, useState } from "react";

export default function SplashScreen({ onFinish }) {
  // Edit these exactly as you want them to appear:
  const line1 = "Welcome to gauge";                // words appear one-by-one
  const line2 = "Amplify your brand, Make more Money"; // optional subline (also word-by-word)

  // convert lines into word arrays, preserving punctuation/casing
  const words1 = useMemo(() => line1.split(" "), [line1]);
  const words2 = useMemo(() => line2.split(" "), [line2]);

  const [shown1, setShown1] = useState(0); // how many words of line1 are visible
  const [shown2, setShown2] = useState(0); // how many words of line2 are visible
  const [finishedTyping, setFinishedTyping] = useState(false);
  const holdTimerRef = useRef(null);

  useEffect(() => {
    let i = 0;
    const stepMs = 400; // word cadence (feel free to tweak)
    const timer = setInterval(() => {
      if (i < words1.length) {
        setShown1((n) => Math.min(n + 1, words1.length));
      } else if (i < words1.length + words2.length) {
        setShown2((n) => Math.min(n + 1, words2.length));
      } else {
        clearInterval(timer);
        setFinishedTyping(true);
      }
      i++;
    }, stepMs);

    return () => clearInterval(timer);
  }, [words1.length, words2.length]);

  useEffect(() => {
    if (!finishedTyping) return;
    // keep splash visible ~10s after sentence completes
    holdTimerRef.current = setTimeout(() => {
      onFinish?.();
    }, 10000);
    return () => clearTimeout(holdTimerRef.current);
  }, [finishedTyping, onFinish]);

  return (
    <div
      className="splash"
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        background: "rgba(0,0,0,0.55)", // sits over the same global background
        transition: "opacity 600ms ease",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: 900,
          padding: "24px 20px",
        }}
      >
        {/* LINE 1 */}
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            margin: 0,
            letterSpacing: "0.02em",
            fontWeight: 800,
          }}
        >
          {words1.slice(0, shown1).join(" ")}
          <span className="caret" style={{ opacity: shown1 < words1.length ? 1 : 0 }}>
            &nbsp;
          </span>
        </h1>

        {/* LINE 2 (optional) */}
        <p
          style={{
            marginTop: 16,
            fontSize: "clamp(16px, 2.4vw, 28px)",
            opacity: shown1 >= words1.length ? 1 : 0.25,
            transition: "opacity 300ms ease",
          }}
        >
          {words2.slice(0, shown2).join(" ")}
        </p>
      </div>
    </div>
  );
}
