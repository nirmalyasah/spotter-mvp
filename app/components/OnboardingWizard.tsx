"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXERCISES } from "@/lib/exercises";
import { validateText } from "@/lib/safety";

type Key = "goal" | "days" | "age" | "gym" | "nervous";
const QUESTIONS: { key: Key; text: string; hint: string }[] = [
  { key: "goal", text: "Hi, I'm Spotter, your gym buddy. What's your main goal?", hint: "e.g. get stronger, lose some fat, feel fit" },
  { key: "days", text: "How many days a week can you come to the gym?", hint: "a number from 1 to 7" },
  { key: "age", text: "How old are you?", hint: "a number, like 24" },
  { key: "gym", text: "Which gym do you go to?", hint: "e.g. Anytime Fitness" },
  { key: "nervous", text: "What makes you nervous about the gym? Say it however you like.", hint: "e.g. I'm scared and don't know the machines" },
];

function check(key: Key, v: string): string | null {
  const t = v.trim();
  if (key === "age") { const n = Number(t); return Number.isInteger(n) && n >= 10 && n <= 100 ? null : "Please type your age as a number, like 24."; }
  if (key === "days") { const n = Number(t); return Number.isInteger(n) && n >= 1 && n <= 7 ? null : "Please type a number from 1 to 7."; }
  return validateText(t);
}

export default function OnboardingWizard({ initialAvailable }: { initialAvailable: string[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Partial<Record<Key, string>>>({});
  const [value, setValue] = useState("");
  const [problem, setProblem] = useState("");
  const [bad, setBad] = useState(0);
  const [avail, setAvail] = useState<string[]>(initialAvailable);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [upgrade, setUpgrade] = useState(false);
  const [blocked, setBlocked] = useState("");
    const step = Object.keys(answers).length;
  const chatDone = step >= QUESTIONS.length;

  function next() {
    const q = QUESTIONS[step];
    const err = check(q.key, value);
    if (err) { setProblem(err); setBad((n) => n + 1); return; }
    setAnswers({ ...answers, [q.key]: value.trim() }); setValue(""); setProblem(""); setBad(0);
  }

  async function build(forceStandard = false) {
    setBusy(true); setError(""); setUpgrade(false);
    try {
      const res = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...answers, availableIds: avail, forceStandard }) });
      const data = await res.json();
      if (data.status === "blocked") { setBlocked(data.message); return; }
      if (!res.ok) { setError(data.error ?? "Something went wrong."); setUpgrade(data.code === "upgrade"); return; }
      router.push("/app"); router.refresh();
    } catch { setError("We couldn't reach the server. Check your connection and try again."); }
    finally { setBusy(false); }
  }

  if (blocked) return (
    <div className="card !border-0 !bg-amber-50 !p-6 ring-1 ring-amber-200">
      <p className="text-lg font-bold">A person needs to check this first</p>
      <p className="mt-2 text-slate-700">{blocked}</p>
      <p className="mt-3 text-sm text-slate-600">Your workouts are paused until you update your answers. Spotter keeps you safe by not guessing.</p>
      <button className="btn btn-ghost mt-4" onClick={() => { setBlocked(""); setAnswers({}); }}>Go back and change my answers</button>
    </div>
  );

  return (
    <div className="card !p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Step {chatDone ? "2 of 2" : `1 of 2 · question ${step + 1} of ${QUESTIONS.length}`}</p>
      {QUESTIONS.slice(0, Math.min(step + 1, QUESTIONS.length)).map((q, i) => (
        <div key={q.key}>
          <div className="mb-2 mr-8 rounded-2xl rounded-tl-sm bg-emerald-50 px-4 py-3 text-slate-800">{q.text}</div>
          {answers[q.key] && <div className="mb-2 ml-8 rounded-2xl rounded-tr-sm bg-emerald-600 px-4 py-3 text-white">{answers[q.key]}</div>}
          {i === step && !chatDone && problem && <div className="notice mb-2">{problem}</div>}
        </div>
      ))}

      {!chatDone && (
        <div className="mt-3">
          <input autoFocus className="input" value={value} placeholder={QUESTIONS[step].hint} aria-label={QUESTIONS[step].text}
            onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && next()} />
          <button className="btn btn-primary mt-3 w-full" onClick={next}>Send</button>
          {bad >= 2 && step === QUESTIONS.length - 1 && <button className="mt-3 w-full text-sm text-slate-500 underline" onClick={() => { setAnswers({ ...answers, nervous: "not sure yet" }); }}>Skip this one</button>}
        </div>
      )}

      {chatDone && (
        <div className="mt-4">
          <div className="mb-2 mr-8 rounded-2xl rounded-tl-sm bg-emerald-50 px-4 py-3 text-slate-800">Last step: tick the machines and weights your gym has. I'll only plan with those.</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXERCISES.map((e) => (
              <label key={e.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200 has-[:checked]:bg-emerald-50 has-[:checked]:ring-emerald-300">
                <input type="checkbox" className="h-5 w-5 accent-emerald-600" checked={avail.includes(e.id)}
                  onChange={() => setAvail(avail.includes(e.id) ? avail.filter((x) => x !== e.id) : [...avail, e.id])} />
                <span><span className="font-semibold">{e.name}</span><span className="block text-xs text-slate-500">{e.equipment}</span></span>
              </label>))}
          </div>
          {error && <p className="error mt-3" role="alert">{error}{upgrade && <> Spotter Plus is coming soon. <a className="font-semibold underline" href="/app/settings">Join the waitlist</a>.</>}</p>}
          <button className="btn btn-primary mt-4 w-full" disabled={busy} onClick={() => build()}>{busy ? "Building your plan… about 10 seconds" : "Build my plan"}</button>
          {error && !upgrade && <button className="mt-3 w-full text-sm text-slate-500 underline" disabled={busy} onClick={() => build(true)}>Use a standard beginner plan instead</button>}
        </div>
      )}
    </div>
  );
}
