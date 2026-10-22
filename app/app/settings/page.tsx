import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getPlan, getProfile } from "@/lib/queries";
import { demoToolsEnabled } from "@/lib/config";
import SettingsClient from "@/app/components/SettingsClient";
import { EXERCISE_IDS } from "@/lib/exercises";
import { getAccess } from "@/lib/access";
import { APP, FREE } from "@/lib/config";
import { q } from "@/lib/db";
import PlusSoon from "@/app/components/PlusSoon";

export const metadata = { title: "Settings" };

export default async function Settings() {
  const user = await requireUser();
  const [profile, plan, access, waitlisted] = await Promise.all([getProfile(user.id), getPlan(user.id), getAccess(user.id, user.plan), q(`select 1 from waitlist where user_id = $1`, [user.id])]);
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight">Settings</h1>

      <div className="card">
        <p className="font-bold">You</p>
        <p className="mt-1 text-slate-600">{user.name} · <span className="chip">{access.paid ? "Spotter Plus" : "Free try-out"}</span></p>
      </div>

      <div className="card">
        <p className="font-bold">Your plan</p>
        {access.paid ? (
          <p className="mt-2 text-slate-600">You have Spotter Plus: unlimited workouts, comeback sessions, the plateau check, unlimited coach and plan rebuilds.</p>
        ) : (
          <div className="mt-2 space-y-3">
            <p className="text-slate-600">Free try-out: <b>{access.workoutsLeft} of {FREE.workouts}</b> workouts left · <b>{access.coachLeft} of {FREE.coachQuestions}</b> coach questions left · <b>{access.buildsLeft} of {FREE.planBuilds}</b> plan builds left.</p>
            <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
              <p className="font-bold">Spotter Plus <span className="chip ml-1">Coming soon</span></p>
              <p className="mt-1 text-sm text-slate-600">For people who train every day: unlimited workouts, automatic weight progression, comeback sessions, the plateau check, an unlimited AI coach and unlimited plan rebuilds. Planned at ₹{APP.plusPriceInr}/month. It isn't on sale yet and nothing is charged.</p>
              <div className="mt-3"><PlusSoon initialJoined={waitlisted.length > 0} label="Join the Plus waitlist" /></div>
            </div>
          </div>)}
      </div>

      {profile && <div className="card">
        <p className="font-bold">Your setup</p>
        <p className="mt-1 text-sm text-slate-600">{profile.goal} · {profile.days_per_week} days a week · {profile.gym}</p>
        {plan?.fallback && <p className="notice mt-3">Your plan is the standard starter plan (the AI wasn't available). Rebuild it for a personalised one.</p>}
        <Link href="/onboarding" className="btn btn-ghost mt-3">Answer the questions again and rebuild my plan</Link>
      </div>}

      <SettingsClient available={profile?.available_ids?.length ? profile.available_ids : EXERCISE_IDS} hasProfile={!!profile} demo={demoToolsEnabled()} isPlus={access.paid} />
    </div>
  );
}
