"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXERCISES } from "@/lib/exercises";

export default function SettingsClient({ available, hasProfile, demo, isPro }: { available: string[]; hasProfile: boolean; demo: boolean; isPro: boolean }) {
  const router = useRouter();
  const [avail, setAvail] = useState(available);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [reason, setReason] = useState("");

  async function call(label: string, url: string, method: string, data?: unknown, ok?: string) {
    setBusy(label); setMsg(""); setErr("");
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: data ? JSON.stringify(data) : undefined });
      const out = await res.json();
      if (!res.ok) { setErr(out.error ?? "Something went wrong."); return null; }
      if (ok) setMsg(ok); router.refresh(); return out;
    } catch { setErr("We couldn't reach the server."); return null; }
    finally { setBusy(""); }
  }

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); }
  async function del() {
    if (!confirm("Delete your account and ALL your data? This can't be undone.")) return;
    const out = await call("delete", "/api/account", "DELETE");
    if (out) { router.push("/"); router.refresh(); }
  }

  return (
    <>
      {hasProfile && (
        <div className="card">
          <p className="font-bold">Machines your gym has</p>
          <p className="mb-3 text-sm text-slate-500">Spotter only plans with these. Changes apply to your next workouts.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXERCISES.map((e) => (
              <label key={e.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200 has-[:checked]:bg-emerald-50 has-[:checked]:ring-emerald-300">
                <input type="checkbox" className="h-5 w-5 accent-emerald-600" checked={avail.includes(e.id)} onChange={() => setAvail(avail.includes(e.id) ? avail.filter((x) => x !== e.id) : [...avail, e.id])} />
                <span><span className="font-semibold">{e.name}</span><span className="block text-xs text-slate-500">{e.equipment}</span></span>
              </label>))}
          </div>
          <button className="btn btn-dark mt-4" disabled={busy === "eq"} onClick={() => call("eq", "/api/equipment", "PATCH", { availableIds: avail }, "Saved your machines.")}>{busy === "eq" ? "Saving…" : "Save machines"}</button>
        </div>)}

      {demo && (
        <div className="card ring-2 ring-dashed ring-amber-300">
          <p className="font-bold">🧪 Demo tools</p>
          <p className="mb-3 text-sm text-slate-500">For showing Spotter off without waiting days or weeks. Hidden on a live site unless switched on.</p>
          <input className="input mb-3" placeholder="Why did you miss days? (optional, e.g. exams)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
          <div className="grid gap-2 sm:grid-cols-3">
            <button className="btn btn-ghost" disabled={!!busy} onClick={() => call("sim", "/api/demo", "POST", { action: "simulate", reason }, "3 days passed. Open Today to see your comeback session.")}>{busy === "sim" ? "Working…" : "Pretend 3 days passed"}</button>
            <button className="btn btn-ghost" disabled={!!busy} onClick={() => call("seed", "/api/demo", "POST", { action: "seed" }, "Added 6 weeks of history. Check Progress, and the plateau check on Coach.")}>{busy === "seed" ? "Working…" : "Add 6 weeks of history"}</button>
            <button className="btn btn-ghost" disabled={!!busy} onClick={() => call("pro", "/api/demo", "POST", { action: "toggle-pro" }, isPro ? "Switched to Free." : "Switched to Pro.")}>{busy === "pro" ? "Working…" : isPro ? "Switch to Free" : "Switch to Pro (demo)"}</button>
          </div>
        </div>)}

      {(msg || err) && <p className={err ? "error" : "notice !bg-emerald-50 !text-emerald-900 !ring-emerald-200"} role="status">{err || msg}</p>}

      <div className="card">
        <p className="font-bold">Account actions</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button className="btn btn-ghost" onClick={logout}>Log out</button>
          <button className="btn !bg-red-50 !text-red-700 ring-1 ring-red-200 hover:!bg-red-100" onClick={del} disabled={busy === "delete"}>Delete my account and data</button>
        </div>
        <p className="mt-3 text-xs text-slate-400">Spotter gives general guidance, not medical advice. <a className="underline" href="/legal">Terms, privacy and disclaimer</a></p>
      </div>
    </>
  );
}
