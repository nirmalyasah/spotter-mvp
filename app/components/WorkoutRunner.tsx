"use client";
import { useEffect, useState } from "react";

export type Card = { id: string; kg: number; sets: number; reps: number; name: string; equipment: string; setup: string[]; tip: string };
export type SessionView = { id: string; kind: "regular" | "comeback"; title: string; message?: string; cards: Card[]; doneIds: string[]; restSec: number };
type Result = { perfect: boolean; increased: boolean; newKg: number; name: string; kind: string };

export default function WorkoutRunner({ session, onExit }: { session: SessionView; onExit: () => void }) {
  const firstTodo = session.cards.findIndex((c) => !session.doneIds.includes(c.id));
  const [idx, setIdx] = useState(firstTodo === -1 ? session.cards.length : firstTodo);
  const [setsDone, setSetsDone] = useState(0);
  const [rest, setRest] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [summary, setSummary] = useState<{ exercises: number; volume: number; total: number; streakWeeks: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState("");
  const [reported, setReported] = useState(false);
  const card = session.cards[idx];

  useEffect(() => {
    if (rest === null) return;
    if (rest <= 0) { setRest(null); return; }
    const t = setTimeout(() => setRest(rest - 1), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  // Each new step starts at the top of the screen (matters on phones).
  useEffect(() => { window.scrollTo({ top: 0 }); }, [idx, !!result, !!summary]);

  useEffect(() => { if (idx >= session.cards.length && !summary && !result) void finish(); }, []); // eslint-disable-line

  async function post(url: string, data: unknown) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error ?? "Something went wrong.");
    return out;
  }

  async function saveExercise(n: number) {
    setBusy(true); setError("");
    try {
      const out = await post("/api/workout/exercise", { sessionId: session.id, exerciseId: card.id, setsCompleted: n });
      setResult({ perfect: out.perfect, increased: out.increased, newKg: out.newKg, name: card.name, kind: out.kind });
      setRest(null);
    } catch (e) { setError((e as Error).message + " Tap again to retry."); }
    finally { setBusy(false); }
  }

  function setDone() {
    const n = setsDone + 1;
    setSetsDone(n);
    if (n >= card.sets) void saveExercise(n); else setRest(session.restSec);
  }

  async function next() {
    setResult(null); setSetsDone(0);
    if (idx + 1 >= session.cards.length) { setIdx(idx + 1); await finish(); } else setIdx(idx + 1);
  }

  async function finish() {
    setBusy(true); setError("");
    try { setSummary(await post("/api/workout/finish", { sessionId: session.id })); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function report() {
    try { await post("/api/report", { exerciseId: card.id, note }); setReported(true); setReporting(false); } catch { setError("Couldn't send the report."); }
  }

  if (summary) return (
    <div className="card space-y-4 text-center !p-8">
      <p className="text-5xl" aria-hidden>🎉</p>
      <h1 className="text-3xl font-black">{session.kind === "comeback" ? "You're back!" : "Workout complete"}</h1>
      <div className="grid grid-cols-3 gap-3">
        {[[summary.exercises, "exercises"], [summary.volume.toLocaleString(), "kg lifted"], [summary.streakWeeks, "week streak"]].map(([n, l]) => (
          <div key={String(l)} className="rounded-xl bg-emerald-50 p-3"><p className="text-2xl font-black text-emerald-700">{n}</p><p className="text-xs text-slate-600">{l}</p></div>))}
      </div>
      <p className="text-slate-600">{session.kind === "comeback" ? "Next time you'll be back on your normal plan." : "Your weights for next time are updated automatically."}</p>
      <button className="btn btn-primary w-full" onClick={onExit}>Done</button>
    </div>
  );

  if (!card) return <div className="card text-center">{error ? <p className="error">{error}</p> : <p>Wrapping up…</p>}{error && <button className="btn btn-primary mt-3" onClick={finish}>Try again</button>}</div>;

  if (result) return (
    <div className="card space-y-4 text-center !p-8">
      <p className="text-4xl" aria-hidden>{result.perfect ? "💪" : "👍"}</p>
      <h2 className="text-2xl font-black">{result.name} done</h2>
      <p className="text-slate-700">
        {result.kind === "comeback" ? "Nice work easing back in." : result.increased ? <>All sets done! Next time: <b className="text-emerald-700">{result.newKg} kg</b> (+{(result.newKg - card.kg).toFixed(1).replace(".0", "")} kg).</> : result.perfect ? "Great work! You're at the max for this exercise." : <>No problem. You'll stay at <b>{result.newKg} kg</b> next time until all sets feel good.</>}
      </p>
      {error && <p className="error">{error}</p>}
      <button className="btn btn-primary w-full" onClick={next} disabled={busy}>{idx + 1 >= session.cards.length ? "Finish workout" : "Next exercise"}</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-sm font-semibold text-slate-500"><span>{session.title}</span><span>Exercise {idx + 1} of {session.cards.length}</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${(idx / session.cards.length) * 100}%` }} /></div>
      </div>
      {idx === 0 && session.message && <p className="notice !bg-emerald-50 !text-emerald-900 !ring-emerald-200">{session.message}</p>}

      <div className="card !p-6">
        <p className="text-3xl font-black tracking-tight">{card.name}</p>
        <p className="text-slate-500"><b className="text-slate-700">Machine:</b> {card.equipment}</p>
        <p className="mt-3 text-4xl font-black text-emerald-600">{card.kg} kg <span className="text-slate-900">· {card.sets} × {card.reps}</span></p>
        <p className="text-sm text-slate-500">Rest about {session.restSec} seconds between sets.</p>
        <p className="mt-4 font-bold">How to set it up</p>
        <ol className="mt-1 list-decimal space-y-1.5 pl-5 text-slate-700">{card.setup.map((s) => <li key={s}>{s}</li>)}</ol>
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">💡 {card.tip}</p>

        <div className="mt-5 grid gap-2" style={{ gridTemplateColumns: `repeat(${card.sets}, minmax(0, 1fr))` }} aria-label="Sets">
          {Array.from({ length: card.sets }, (_, i) => <div key={i} className={`rounded-lg py-2 text-center text-sm font-bold ${i < setsDone ? "bg-emerald-600 text-white" : i === setsDone ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400" : "bg-slate-100 text-slate-400"}`}>{i < setsDone ? "✓" : `Set ${i + 1}`}</div>)}
        </div>

        {rest !== null ? (
          <div className="mt-4 rounded-xl bg-slate-900 p-4 text-center text-white" role="timer">
            <p className="text-sm text-slate-300">Rest</p><p className="text-5xl font-black tabular-nums">{rest}s</p>
            <button className="mt-2 text-sm font-semibold underline" onClick={() => setRest(null)}>Skip rest</button>
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            <button className="btn btn-primary w-full text-lg" onClick={setDone} disabled={busy}>{busy ? "Saving…" : `Set ${setsDone + 1} done ✓`}</button>
            <button className="btn btn-ghost w-full" onClick={() => saveExercise(setsDone)} disabled={busy}>Couldn't finish this one</button>
          </div>
        )}
        {error && <p className="error mt-3" role="alert">{error}</p>}
      </div>

      <div className="text-center text-sm text-slate-500">
        <p>⚠️ Set-up not yet verified by gym staff. If something feels wrong or painful, stop and ask someone at the gym.</p>
        {reported ? <p className="mt-2 font-semibold text-emerald-700">Thanks, we'll check this exercise.</p> : reporting ? (
          <div className="mx-auto mt-2 max-w-sm space-y-2"><textarea className="input" rows={2} placeholder="What's wrong with this card?" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            <div className="flex gap-2"><button className="btn btn-dark flex-1 !py-2" onClick={report}>Send report</button><button className="btn btn-ghost flex-1 !py-2" onClick={() => setReporting(false)}>Cancel</button></div></div>
        ) : <button className="mt-2 underline" onClick={() => setReporting(true)}>This looks wrong</button>}
      </div>
    </div>
  );
}
