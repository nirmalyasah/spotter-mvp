"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CodeLogin() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      router.push("/app"); router.refresh();
    } catch { setError("We couldn't reach the server. Check your connection."); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={go} className="card space-y-4 !p-6">
      <h1 className="text-2xl font-black">Welcome back</h1>
      <p className="text-slate-600">Enter the access code you were given when you joined. It's how you get back in from another phone or browser.</p>
      <div><label htmlFor="code" className="label">Your access code</label>
        <input id="code" className="input text-center text-xl font-bold uppercase tracking-widest" placeholder="XXXXX-XXXXX" value={code} maxLength={14} autoCapitalize="characters" autoComplete="off" onChange={(e) => setCode(e.target.value)} /></div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy || code.trim().length < 5}>{busy ? "Checking…" : "Log in"}</button>
    </form>
  );
}
