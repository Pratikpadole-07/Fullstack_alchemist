function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

const styles = {
  verified: 'bg-emerald-400/15 text-emerald-100 border-emerald-300/20',
  pending: 'bg-amber-400/15 text-amber-100 border-amber-300/20',
  rejected: 'bg-red-400/15 text-red-100 border-red-300/20',
  missing: 'bg-white/10 text-white/70 border-white/15',
  flagged: 'bg-fuchsia-400/15 text-fuchsia-100 border-fuchsia-300/20',
}

export default function StatusPill({ status = 'missing', label }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        styles[status] || styles.missing
      )}
    >
      {label || status}
    </span>
  )
}

