const styles = {
  owner_verified: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  partially_verified: "bg-amber-500/15 text-amber-200 border-amber-500/40",
  rejected: "bg-red-500/15 text-red-300 border-red-500/40",
  pending: "bg-slate-500/15 text-slate-300 border-slate-500/40",
};

const labels = {
  owner_verified: "Verified Owner",
  partially_verified: "Partial",
  rejected: "Rejected",
  pending: "Pending",
};

export default function StatusBadge({ status }) {
  const key = status && styles[status] ? status : "pending";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles[key]}`}
    >
      {labels[key] || labels.pending}
    </span>
  );
}
