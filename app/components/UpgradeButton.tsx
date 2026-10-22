"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UpgradeButton({ label = "Upgrade to Pro", portal = false, className = "btn btn-primary" }: { label?: string; portal?: boolean; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function go() {
    setBusy(true); setMsg("");
    try {
      const res = await fetch(portal ? "/api/billing/portal" : "/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setMsg(data.error ?? "Something went wrong."); router.refresh();
    } catch { setMsg("We couldn't reach the server."); }
    finally { setBusy(false); }
  }
  return <div><button className={className} onClick={go} disabled={busy}>{busy ? "Please wait…" : label}</button>{msg && <p className="notice mt-3" role="status">{msg}</p>}</div>;
}
