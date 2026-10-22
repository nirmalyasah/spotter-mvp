import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { getPlan, getProfile, getWeights } from "@/lib/queries";
import { byId } from "@/lib/exercises";
import { nextDayIndex } from "@/lib/plan";

export const metadata = { title: "Your plan" };

export default async function PlanPage() {
  const user = await requireUser();
  const [profile, plan, weights] = await Promise.all([getProfile(user.id), getPlan(user.id), getWeights(user.id)]);
  if (!profile || !plan) redirect("/onboarding");
  const done = (await q<{ n: number }>(`select count(*)::int as n from sessions where user_id = $1 and kind = 'regular' and completed_at is not null`, [user.id]))[0].n;
  const next = nextDayIndex(done, plan.days.length);
  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-black tracking-tight">Your plan</h1>
        <p className="mt-1 text-slate-600">{profile.days_per_week} days a week, cycling through these {plan.days.length} workouts. Your next one is highlighted.</p></div>
      {plan.fallback && <p className="notice">This is the standard starter plan. <Link href="/onboarding" className="font-semibold underline">Rebuild it</Link> for a personalised one.</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {plan.days.map((ids, i) => (
          <div key={i} className={`card ${i === next ? "ring-2 ring-emerald-400" : ""}`}>
            <div className="flex items-center justify-between"><p className="text-lg font-extrabold">Day {i + 1}</p>{i === next && <span className="chip">Next up</span>}</div>
            <ul className="mt-3 divide-y divide-slate-100">
              {ids.map((id) => { const e = byId(id); if (!e) return null; return (
                <li key={id} className="py-2.5"><p className="font-semibold">{e.name}</p><p className="text-xs text-slate-500">{e.equipment}</p><p className="text-sm text-emerald-700">{weights[id] ?? e.startKg} kg · 3 × 10</p></li>); })}
            </ul>
          </div>))}
      </div>
      <div className="flex flex-wrap gap-3"><Link href="/app" className="btn btn-primary">Go to today's workout</Link><Link href="/onboarding" className="btn btn-ghost">Rebuild my plan</Link></div>
      <p className="text-sm text-slate-500">Weights go up by themselves when you finish every set, so this page always shows what you'll lift next.</p>
    </div>
  );
}
