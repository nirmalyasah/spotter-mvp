"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: string; kind?: string; content: string };

export default function CoachClient({ initial }: { initial: Msg[] }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [plateau, setPlateau] = useState<{ flagged: { name: string; kg: number; weeks: number }[]; text: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const m = text.trim(); if (m.length < 2) return;
    setMsgs((x) => [...x, { role: "user", content: m }]); setText(""); setBusy(true); setError("");
    try {
      const res = await fetch("/api/coach/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: m }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setMsgs((x) => [...x, { role: "assistant", content: data.reply }]);
    } catch { setError("We couldn't reach the server."); }
    finally { setBusy(false); }
  }

  async function checkPlateau() {
    setChecking(true); setError("");
    try {
      const res = await fetch("/api/coach/plateau", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setPlateau(data);
    } catch { setError("We couldn't reach the server."); }
    finally { setChecking(false); }
  }

  const chat = msgs.filter((m) => m.kind !== "plateau");
  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-start justify-between gap-3"><div><p className="font-bold">🔍 Plateau check</p><p className="text-sm text-slate-500">Finds lifts that haven't gone up in 3+ weeks and explains why.</p></div>
          <button className="btn btn-dark shrink-0 !py-2" onClick={checkPlateau} disabled={checking}>{checking ? "Checking…" : "Check now"}</button></div>
        {plateau && (
          <div className="mt-4 space-y-3">
            {plateau.flagged.length > 0 && <div className="flex flex-wrap gap-2">{plateau.flagged.map((f) => <span key={f.name} className="chip !bg-amber-50 !text-amber-800 !ring-amber-200">{f.name}: {f.kg} kg for {f.weeks} weeks</span>)}</div>}
            <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-slate-800">{plateau.text}</p>
            <p className="text-xs text-slate-400">Written by AI. General guidance, not medical advice.</p>
          </div>)}
      </div>

      <div className="card !p-0">
        <div className="max-h-[50vh] min-h-48 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {chat.length === 0 && <p className="text-slate-500">Ask me about a machine, your form, how much weight to use, or how to stay motivated.</p>}
          {chat.map((m, i) => <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 ${m.role === "user" ? "ml-auto rounded-tr-sm bg-emerald-600 text-white" : "rounded-tl-sm bg-slate-100 text-slate-800"}`}>{m.content}</div>)}
          {busy && <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-slate-500">Thinking…</div>}
          <div ref={end} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
          <input className="input" placeholder="Ask Spotter…" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} aria-label="Your question" />
          <button className="btn btn-primary" disabled={busy || text.trim().length < 2}>Send</button>
        </form>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <p className="text-center text-xs text-slate-400">Spotter can't help with pain, health conditions, diet, drugs or mental health. Please ask a professional.</p>
    </div>
  );
}
