"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";

// The whole sign-up: type your name. No email, no password.
export default function NameStart({ big = false, button = "Start free" }: { big?: boolean; button?: string }) {
  const router = useRouter();
  const id = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Please tell us what to call you."); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      try { sessionStorage.setItem("spotter_code", data.code); } catch {}
      router.push("/welcome"); router.refresh();
    } catch { setError("We couldn't reach the server. Check your connection."); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={go} className="w-full max-w-md">
      <label htmlFor={id} className="label">What should we call you?</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id={id} className={`input ${big ? "!py-3.5 text-lg" : ""}`} autoComplete="given-name" placeholder="Your first name" value={name} maxLength={40}
          onChange={(e) => setName(e.target.value)} />
        <button className={`btn btn-primary shrink-0 ${big ? "text-lg" : ""}`} disabled={busy}>{busy ? "One moment…" : button}</button>
      </div>
      {error && <p className="error mt-3" role="alert">{error}</p>}
      <p className="mt-2 text-sm text-slate-500">That's it. No email, no password, no card.</p>
    </form>
  );
}
