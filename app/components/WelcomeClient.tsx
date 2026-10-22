"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccessCodeCard from "./AccessCodeCard";

export default function WelcomeClient({ name }: { name: string }) {
  const router = useRouter();
  const [code, setCode] = useState<string | null | undefined>(undefined);
  useEffect(() => { try { setCode(sessionStorage.getItem("spotter_code")); } catch { setCode(null); } }, []);

  function cont() { try { sessionStorage.removeItem("spotter_code"); } catch {} router.push("/onboarding"); }

  return (
    <div className="space-y-5">
      <div><h1 className="text-4xl font-black tracking-tight">Welcome, {name}! 🎉</h1><p className="mt-2 text-lg text-slate-600">You're in. Spotter is completely free and you can use every feature.</p></div>
      {code ? (
        <div className="card space-y-4 !p-5">
          <AccessCodeCard code={code} />
          <p className="text-slate-700"><b>Screenshot or copy this code.</b> You don't have a password, so this code is the only way back into your account if you switch phone, switch browser or clear your cookies. You can make a new one any time in Settings.</p>
        </div>
      ) : code === null ? (
        <p className="notice">You can make a new access code any time in Settings.</p>
      ) : null}
      <button className="btn btn-primary w-full text-lg" onClick={cont}>{code ? "I've saved it. Build my plan" : "Build my plan"}</button>
    </div>
  );
}
