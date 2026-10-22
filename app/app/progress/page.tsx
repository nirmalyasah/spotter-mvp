import { requireUser } from "@/lib/auth";
import { exerciseResults, getStats, recentSessions } from "@/lib/queries";
import { byId } from "@/lib/exercises";
import { weekIndex } from "@/lib/stats";
import { Sparkline, WeekBars } from "@/app/components/Charts";

export const metadata = { title: "Progress" };
const WEEK = 7 * 86400000;

export default async function Progress() {
  const user = await requireUser();
  const [results, stats, recent] = await Promise.all([exerciseResults(user.id), getStats(user.id), recentSessions(user.id)]);
  const now = Date.now();
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const w = weekIndex(now) - (7 - i);
    return { label: i === 7 ? "now" : `-${7 - i}w`, count: stats.dates.filter((d) => weekIndex(d) === w).length };
  });
  const by = new Map<string, number[]>();
  for (const r of results) by.set(r.exerciseId, [...(by.get(r.exerciseId) ?? []), r.kg]);
  const lifts = [...by.entries()].map(([id, kgs]) => ({ id, name: byId(id)?.name ?? id, kgs, best: Math.max(...kgs), first: kgs[0], last: kgs[kgs.length - 1] }))
    .sort((a, b) => (b.last - b.first) - (a.last - a.first));

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight">Your progress</h1>
      <div className="grid grid-cols-3 gap-3">
        {[["🔥", stats.streakWeeks, "week streak"], ["✅", stats.total, "workouts"], ["📅", stats.thisWeek, "this week"]].map(([i, n, l]) => (
          <div key={String(l)} className="card !p-4 text-center"><p aria-hidden>{i}</p><p className="text-2xl font-black">{n}</p><p className="text-xs text-slate-500">{l}</p></div>))}
      </div>
      <div className="card"><p className="mb-3 font-bold">Workouts per week</p><WeekBars weeks={weeks} /></div>

      <div className="card">
        <p className="mb-3 font-bold">Your lifts</p>
        {lifts.length === 0 ? <p className="text-slate-500">Finish your first workout and your lifts will show up here.</p> : (
          <ul className="divide-y divide-slate-100">
            {lifts.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                <div><p className="font-semibold">{l.name}</p><p className="text-sm text-slate-500">{l.first} kg → <b className="text-slate-800">{l.last} kg</b>{l.last > l.first && <span className="ml-1 font-semibold text-emerald-600">+{(l.last - l.first).toFixed(1).replace(".0", "")}</span>} · best {l.best} kg</p></div>
                <Sparkline points={l.kgs.slice(-12)} />
              </li>))}
          </ul>)}
      </div>

      <div className="card">
        <p className="mb-3 font-bold">Recent workouts</p>
        {recent.length === 0 ? <p className="text-slate-500">Nothing yet.</p> : (
          <ul className="divide-y divide-slate-100">{recent.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
              <span>{new Date(s.completed_at).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} {s.kind === "comeback" && <span className="chip ml-1">comeback</span>}</span>
              <span className="text-slate-500">{s.exercises} exercises · {Math.round(s.volume).toLocaleString()} kg</span>
            </li>))}</ul>)}
      </div>
    </div>
  );
}
