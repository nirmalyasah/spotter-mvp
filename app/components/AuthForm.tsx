"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      router.push("/app"); router.refresh();
    } catch { setError("We couldn't reach the server. Check your connection."); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 !p-6">
      <h1 className="text-2xl font-black">{signup ? "Create your free account" : "Welcome back"}</h1>
      {signup && <div><label className="label" htmlFor="name">Your name</label><input id="name" className="input" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>}
      <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" className="input" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" className="input" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 8 : 1} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
        {signup && <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>}</div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Log in"}</button>
      <p className="text-center text-sm text-slate-600">{signup ? <>Already have an account? <Link href="/login" className="font-semibold text-emerald-700">Log in</Link></> : <>New here? <Link href="/signup" className="font-semibold text-emerald-700">Create a free account</Link></>}</p>
    </form>
  );
}
