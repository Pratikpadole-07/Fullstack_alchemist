export default function ScoreCard({ score, title = "Ownership score" }) {
  const n = Math.min(100, Math.max(0, Number(score) || 0));
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <span className="text-3xl font-bold tabular-nums text-white">{n}</span>
      </div>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
          style={{ width: `${n}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">Weighted from director match, domain email, GST, and MCA status.</p>
    </div>
  );
}
