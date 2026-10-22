import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/queries";
import { EXERCISE_IDS } from "@/lib/exercises";
import OnboardingWizard from "../components/OnboardingWizard";
import Logo from "../components/Logo";

export const metadata = { title: "Set up your plan" };

export default async function Onboarding() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <Logo href="/app" />
      <h1 className="mt-6 text-3xl font-black tracking-tight">Let's build your plan</h1>
      <p className="mb-5 mt-1 text-slate-600">Two minutes. Answer in your own words, there are no wrong answers.</p>
      <OnboardingWizard initialAvailable={profile?.available_ids?.length ? profile.available_ids : EXERCISE_IDS} />
    </main>
  );
}
