import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getPlan, getProfile, aiUsageThisMonth } from "@/lib/queries";
import { APP, demoToolsEnabled } from "@/lib/config";
import { stripeConfigured } from "@/lib/billing";
import SettingsClient from "@/app/components/SettingsClient";
import UpgradeButton from "@/app/components/UpgradeButton";
import { EXERCISE_IDS } from "@/lib/exercises";

export const metadata = { title: "Settings" };

export default async function Settings({ searchParams }: { searchParams: Promise<{ upgraded?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [profile, plan, builds] = await Promise.all([getProfile(user.id), getPlan(user.id), aiUsageThisMonth(user.id, "plan")]);
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight">Settings</h1>
      {sp.upgraded && <p className="notice !bg-emerald-50 !text-emerald-900 !ring-emerald-200">🎉 Thanks! If Pro doesn't show up in a few seconds, refresh the page.</p>}

      <div className="card">
        <p className="font-bold">Account</p>
        <p className="mt-1 text-slate-600">{user.name} · {user.email}</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between"><p className="font-bold">Your plan</p><span className="chip">{user.plan === "pro" ? "Spotter Pro" : "Free"}</span></div>
        {user.plan === "pro" ? (
          <div className="mt-3"><p className="text-slate-600">You have unlimited plan rebuilds, the plateau check and Ask Spotter.</p>{stripeConfigured() && <div className="mt-3"><UpgradeButton portal label="Manage billing" className="btn btn-ghost" /></div>}</div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-slate-600">Plan builds used this month: <b>{builds}/{APP.freePlanBuildsPerMonth}</b>. Pro adds unlimited rebuilds, the plateau check and Ask Spotter for ₹{APP.proPriceInr}/month.</p>
            <UpgradeButton />
          </div>)}
      </div>

      {profile && <div className="card">
        <p className="font-bold">Your setup</p>
        <p className="mt-1 text-sm text-slate-600">{profile.goal} · {profile.days_per_week} days a week · {profile.gym}</p>
        {plan?.fallback && <p className="notice mt-3">Your plan is the standard starter plan (the AI wasn't available). Rebuild it for a personalised one.</p>}
        <Link href="/onboarding" className="btn btn-ghost mt-3">Answer the questions again and rebuild my plan</Link>
      </div>}

      <SettingsClient available={profile?.available_ids?.length ? profile.available_ids : EXERCISE_IDS} hasProfile={!!profile} demo={demoToolsEnabled()} isPro={user.plan === "pro"} />
    </div>
  );
}
