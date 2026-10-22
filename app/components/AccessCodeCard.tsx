"use client";
import { useState } from "react";

// Shows an access code with a copy button.
export default function AccessCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} }
  return (
    <div className="rounded-2xl bg-slate-900 p-5 text-center text-white">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Your access code</p>
      <p className="my-2 select-all whitespace-nowrap text-[1.7rem] font-black tracking-wider sm:text-4xl sm:tracking-widest" aria-label={`Access code ${code.split("").join(" ")}`}>{code}</p>
      <button onClick={copy} className="btn btn-ghost !py-2 text-sm">{copied ? "Copied ✓" : "Copy code"}</button>
    </div>
  );
}
