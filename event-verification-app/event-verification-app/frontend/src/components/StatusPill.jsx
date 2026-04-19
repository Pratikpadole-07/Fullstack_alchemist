export default function StatusPill({ status }) {
  const s = status || "pending";
  return <span className={`badge ${s}`}>{s.replaceAll("_", " ")}</span>;
}
