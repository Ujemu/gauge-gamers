import gaugeLogo from "../assets/gauge-logo.png";  // <-- PNG (not SVG)

export default function GaugeBadge() {
  return (
    <div style={styles.badge}>
      <img src={gaugeLogo} alt="Gauge logo" style={styles.logo} />
      <span style={styles.text}>Gauge Gamers</span>
    </div>
  );
}

const styles = {
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    borderRadius: 20,
    background:
      "linear-gradient(90deg, rgb(59,130,246) 0%, rgb(236,72,153) 100%)",
    color: "#fff",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  },
  logo: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 2,
    objectFit: "cover",
  },
  text: {
    fontFamily:
      '"PT Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontWeight: 700,
    letterSpacing: 0.3,
  },
};
