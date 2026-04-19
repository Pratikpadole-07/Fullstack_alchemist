export default function TrustBadge({ score = 0 }) {
  const n = Number(score) || 0;
  let tone = "bad";
  let label = "Low trust";
  if (n >= 80) {
    tone = "good";
    label = "High trust";
  } else if (n >= 50) {
    tone = "warn";
    label = "Review";
  }
  const bg =
    tone === "good"
      ? "rgba(34,197,94,0.2)"
      : tone === "warn"
        ? "rgba(234,179,8,0.25)"
        : "rgba(239,68,68,0.2)";
  const color = tone === "good" ? "var(--good)" : tone === "warn" ? "var(--warn)" : "var(--bad)";
  return (
    <span
      className="badge"
      style={{ background: bg, color, border: `1px solid ${color}` }}
      title="Trust score badge"
    >
      {label} · {n}
    </span>
  );
}
