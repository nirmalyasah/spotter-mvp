// Tiny dependency-free SVG charts.
export function Sparkline({ points, width = 160, height = 48 }: { points: number[]; width?: number; height?: number }) {
  if (points.length < 2) return <span className="text-xs text-slate-400">Needs 2+ sessions</span>;
  const min = Math.min(...points), max = Math.max(...points), span = max - min || 1, pad = 4;
  const xy = points.map((p, i) => [pad + (i * (width - pad * 2)) / (points.length - 1), height - pad - ((p - min) / span) * (height - pad * 2)]);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={`From ${points[0]} to ${points[points.length - 1]} kg`}>
      <polyline points={xy.map((p) => p.join(",")).join(" ")} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 4 : 2.5} fill="#059669" />)}
    </svg>
  );
}

export function WeekBars({ weeks }: { weeks: { label: string; count: number }[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  return (
    <div className="flex h-36 items-end gap-2" role="img" aria-label="Workouts per week">
      {weeks.map((w) => (
        <div key={w.label} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs font-bold text-slate-600">{w.count || ""}</span>
          <div className={`w-full rounded-t-md ${w.count ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: `${Math.max(6, Math.round((w.count / max) * 84))}px` }} />
          <span className="text-[10px] text-slate-400">{w.label}</span>
        </div>))}
    </div>
  );
}
