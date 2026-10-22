import { requireUser } from "@/lib/auth";
import { getProfile, getWeights } from "@/lib/queries";
import { EXERCISES, type Muscle } from "@/lib/exercises";

export const metadata = { title: "Exercise library" };
const GROUPS: [Muscle, string][] = [["legs", "Legs"], ["push", "Chest, shoulders and triceps"], ["pull", "Back and biceps"]];

export default async function Library() {
  const user = await requireUser();
  const [profile, weights] = await Promise.all([getProfile(user.id), getWeights(user.id)]);
  const has = profile?.available_ids ?? [];
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black tracking-tight">Exercise library</h1>
        <p className="mt-1 text-slate-600">Learn any machine before you touch it. Tap an exercise for set-up steps and a tip.</p></div>
      {GROUPS.map(([m, title]) => (
        <section key={m}>
          <h2 className="mb-3 text-lg font-bold">{title}</h2>
          <div className="space-y-3">
            {EXERCISES.filter((e) => e.muscle === m).map((e) => (
              <details key={e.id} className="card group !p-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                  <div><p className="font-bold">{e.name}</p><p className="text-sm text-slate-500">{e.equipment}</p></div>
                  <div className="flex shrink-0 items-center gap-2">
                    {profile && !has.includes(e.id) && <span className="chip !bg-slate-100 !text-slate-500 !ring-slate-200">not at your gym</span>}
                    <span className="chip">{weights[e.id] ?? e.startKg} kg</span>
                    <span className="text-slate-400 transition group-open:rotate-90" aria-hidden>›</span>
                  </div>
                </summary>
                <div className="border-t border-slate-100 p-4">
                  <p className="font-semibold">How to set it up</p>
                  <ol className="mt-1 list-decimal space-y-1.5 pl-5 text-slate-700">{e.setup.map((s) => <li key={s}>{s}</li>)}</ol>
                  <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">💡 {e.tip}</p>
                </div>
              </details>))}
          </div>
        </section>))}
      <p className="text-center text-xs text-slate-400">Set-up steps are general and not yet verified by gym staff. If something feels wrong or painful, stop and ask someone at the gym.</p>
    </div>
  );
}
