"use client";
import { useEffect, useState } from "react";

// Spotter Plus is "coming soon". There is no payment: this only adds you to the waitlist.
export default function PlusSoon({ initialJoined = false, label = "Join the waitlist", className = "btn btn-primary" }: { initialJoined?: boolean; label?: string; className?: string }) {
  const [joined, setJoined] = useState(initialJoined);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { setJoined(initialJoined); }, [initialJoined]);

  async function join() {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/waitlist", { method: "POST" });
      if (!res.ok) { setErr("Something went wrong. Please try again."); return; }
      setJoined(true);
    } catch { setErr("We couldn't reach the server."); }
    finally { setBusy(false); }
  }

  if (joined) return <p className="notice !bg-emerald-50 !text-emerald-900 !ring-emerald-200">✓ You're on the Spotter Plus waitlist. We'll open it to the waitlist first.</p>;
  return <div><button className={className} onClick={join} disabled={busy}>{busy ? "Adding you…" : label}</button>{err && <p className="error mt-3" role="alert">{err}</p>}</div>;
}
