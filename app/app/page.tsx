import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getPlan, getProfile, getStats, pendingComeback } from "@/lib/queries";
import { q } from "@/lib/db";
import { byId } from "@/lib/exercises";
import { nextDayIndex } from "@/lib/plan";
import TodayClient from "../components/TodayClient";
import { getAccess } from "@/lib/access";
import { APP, FREE } from "@/lib/config";

export const metadata = { title: "Today" };

export default async function Today() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const plan = await getPlan(user.id);
  if (!profile || (!plan && !profile.flagged)) redirect("/onboarding");

  if (profile.flagged) return (
    <div className="card !border-0 !bg-amber-50 ring-1 ring-amber-200">
      <p className="text-lg font-bold">A person needs to check this first</p>
      <p className="mt-2 text-slate-700">{profile.flagged}</p>
      <Link href="/onboarding" className="btn btn-ghost mt-4">Update my answers</Link>
    </div>
  );

  const [stats, cb, access, waitlisted, completed] = await Promise.all([
    getStats(user.id), pendingComeback(user.id), getAccess(user.id, user.plan),
    q(`select 1 from waitlist where user_id = $1`, [user.id]),
    q<{ n: number }>(`select count(*)::int as n from sessions where user_id = $1 and kind = 'regular' and completed_at is not null`, [user.id]),
  ]);
  const day = nextDayIndex(completed[0].n, plan!.days.length);
  const preview = plan!.days[day].map((id) => byId(id)?.name).filter(Boolean) as string[];

  return (
    <TodayClient
      name={user.name.split(" ")[0]} summary={profile.summary} welcome={profile.welcome} fallback={plan!.fallback}
      preview={preview} dayNumber={day + 1}
      stats={{ total: stats.total, thisWeek: stats.thisWeek, streakWeeks: stats.streakWeeks, daysSince: stats.daysSince, daysPerWeek: profile.days_per_week }}
      comeback={cb ? { message: cb.message, ai: cb.ai, daysMissed: cb.days_missed } : null}
      access={{ paid: access.paid, workoutsLeft: access.workoutsLeft, freeWorkouts: FREE.workouts, plusPrice: APP.plusPriceInr }}
      onWaitlist={waitlisted.length > 0}
    />
  );
}
