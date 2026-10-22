import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getPlan, getProfile } from "@/lib/queries";
import { demoToolsEnabled } from "@/lib/config";
import SettingsClient from "@/app/components/SettingsClient";
import { EXERCISE_IDS } from "@/lib/exercises";

export const metadata = { title: "Settings" };

export default async function Settings() {
  const user = await requireUser();
  const [profile, plan] = await Promise.all([getProfile(user.id), getPlan(user.id)]);
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight">Settings</h1>

      <div className="card">
        <p className="font-bold">You</p>
        <p className="mt-1 text-slate-600">{user.name} · <span className="chip">Free, all features</span></p>
      </div>

      {profile && <div className="card">
        <p className="font-bold">Your setup</p>
        <p className="mt-1 text-sm text-slate-600">{profile.goal} · {profile.days_per_week} days a week · {profile.gym}</p>
        {plan?.fallback && <p className="notice mt-3">Your plan is the standard starter plan (the AI wasn't available). Rebuild it for a personalised one.</p>}
        <Link href="/onboarding" className="btn btn-ghost mt-3">Answer the questions again and rebuild my plan</Link>
      </div>}

      <SettingsClient available={profile?.available_ids?.length ? profile.available_ids : EXERCISE_IDS} hasProfile={!!profile} demo={demoToolsEnabled()} />
    </div>
  );
}
