export default function BadgeStrip({ badges = [] }) {
  if (!badges.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <span
          key={`${b.id}-${b.companyId || ''}`}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border ${
            b.warning
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
