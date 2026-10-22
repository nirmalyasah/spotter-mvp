"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import WorkoutRunner, { type SessionView } from "./WorkoutRunner";
import PlusSoon from "./PlusSoon";

type Props = {
  name: string; summary: string; welcome: string; fallback: boolean; preview: string[]; dayNumber: number;
  stats: { total: number; thisWeek: number; streakWeeks: number; daysSince: number; daysPerWeek: number };
  comeback: { message: string; ai: boolean; daysMissed: number } | null;
  access: { paid: boolean; workoutsLeft: number | null; freeWorkouts: number; plusPrice: number };
  onWaitlist: boolean;
};

export default function TodayClient(p: Props) {
  const router = useRouter();
  const [session, setSession] = useState<SessionView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/workout/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Couldn't start the workout."); if (data.code === "onboarding") router.push("/onboarding"); if (data.code === "upgrade") router.refresh(); return; }
      setSession(data);
    } catch { setError("We couldn't reach the server. Check your connection."); }
    finally { setBusy(false); }
  }

  async function comebackNow() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/comeback", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); if (data.code === "upgrade") router.refresh(); return; }
      router.refresh();
    } catch { setError("We couldn't reach the server. Check your connection."); }
    finally { setBusy(false); }
  }

  if (session) return <WorkoutRunner session={session} onExit={() => { setSession(null); router.refresh(); }} />;

  const { stats, access } = p;
  const locked = !access.paid && access.workoutsLeft === 0;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Hi {p.name} 👋</h1>
        <p className="mt-1 text-slate-600">{stats.total === 0 ? "Ready for your first workout? Let's go." : stats.daysSince >= 3 ? "Good to see you. Let's ease back in." : "Here's what's next."}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[["🔥", `${stats.streakWeeks}`, "week streak"], ["📅", `${stats.thisWeek}/${stats.daysPerWeek}`, "this week"], ["✅", `${stats.total}`, "workouts"]].map(([i, n, l]) => (
          <div key={l} className="card !p-4 text-center"><p className="text-xl" aria-hidden>{i}</p><p className="text-2xl font-black">{n}</p><p className="text-xs text-slate-500">{l}</p></div>))}
      </div>

      {p.fallback && <p className="notice">This is a <b>standard starter plan</b>. The AI wasn't available when it was built, so it isn't personalised. You can rebuild it in Settings.</p>}

      {!access.paid && !locked && (
        <p className="notice !bg-emerald-50 !text-emerald-900 !ring-emerald-200">🎁 <b>Free try-out:</b> {access.workoutsLeft} of your {access.freeWorkouts} free workouts left. Spotter Plus for daily users is coming soon.</p>
      )}

      {locked ? (
        <div className="card ring-2 ring-emerald-400">
          <span className="chip">Free try-out complete 🎉</span>
          <p className="mt-3 text-xl font-extrabold">You've done your {access.freeWorkouts} free workouts. Nice work!</p>
          <p className="mt-2 text-slate-600">Spotter Plus is the version for people who train every day: unlimited workouts, automatic weight progression, comeback sessions, the plateau check and an unlimited AI coach. It's planned at ₹{access.plusPrice}/month and it's <b>coming soon</b>. It isn't on sale yet and nothing is charged.</p>
          <div className="mt-4"><PlusSoon initialJoined={p.onWaitlist} label="Join the Plus waitlist" /></div>
          <p className="mt-3 text-sm text-slate-500">Your plan, weights and progress are all saved. You can still browse your plan, the library and your progress.</p>
        </div>
      ) : p.comeback ? (
        <div className="card ring-2 ring-emerald-400">
          <div className="flex items-center gap-2"><span className="chip">Welcome back</span><span className="text-xs text-slate-400">{p.comeback.ai ? "written by AI" : "standard message"}</span></div>
          <p className="mt-3 text-lg font-semibold">{p.comeback.message}</p>
          <p className="mt-2 text-sm text-slate-500">You've been away {p.comeback.daysMissed} days. Today is a shorter, lighter session: 2 exercises at about 80% of your weight.</p>
          <button className="btn btn-primary mt-4 w-full" onClick={start} disabled={busy}>{busy ? "Loading…" : "Start my comeback session"}</button>
        </div>
      ) : p.stats.daysSince >= 3 && p.stats.total > 0 ? (
        <div className="card ring-2 ring-emerald-400">
          <span className="chip">It's been {p.stats.daysSince} days</span>
          <p className="mt-3 text-lg font-semibold">No guilt. Missing a few days happens to everyone.</p>
          <p className="mt-1 text-sm text-slate-500">Spotter can write you a shorter, lighter session to ease back in.</p>
          <button className="btn btn-primary mt-4 w-full" onClick={comebackNow} disabled={busy}>{busy ? "Writing your session… about 10 seconds" : "Get my comeback session"}</button>
          <button className="mt-3 w-full text-sm text-slate-500 underline" onClick={start} disabled={busy}>Or just start my normal workout</button>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between"><span className="chip">Day {p.dayNumber}</span><span className="text-xs text-slate-400">about 35 minutes</span></div>
          <p className="mt-3 text-2xl font-extrabold">Today's workout</p>
          <ol className="mt-3 space-y-1.5">{p.preview.map((n, i) => <li key={n} className="flex gap-3 text-slate-700"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{i + 1}</span>{n}</li>)}</ol>
          <button className="btn btn-primary mt-5 w-full text-lg" onClick={start} disabled={busy}>{busy ? "Loading…" : "Start workout"}</button>
        </div>
      )}
      {error && <p className="error" role="alert">{error}</p>}

      {p.summary && !p.fallback && (
        <div className="card">
          <p className="text-xs font-semibold text-slate-400">HERE'S WHAT SPOTTER UNDERSTOOD <span className="chip ml-1">written by AI</span></p>
          <p className="mt-2 text-slate-700">{p.summary}</p><p className="mt-1 text-slate-700">{p.welcome}</p>
        </div>
      )}
    </div>
  );
}
