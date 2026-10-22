import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { APP } from "@/lib/config";
import CoachClient from "@/app/components/CoachClient";
import UpgradeButton from "@/app/components/UpgradeButton";

export const metadata = { title: "Coach" };

export default async function Coach() {
  const user = await requireUser();
  if (user.plan !== "pro") return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight">Spotter Coach <span className="chip align-middle">PRO</span></h1>
      <div className="card !p-7">
        <p className="text-xl font-bold">Know why you stalled. Ask anything.</p>
        <ul className="mt-4 space-y-3 text-slate-700">
          <li>🔍 <b>Plateau check.</b> Spotter spots lifts that haven't moved in 3 weeks, explains why, and gives 3 things to try.</li>
          <li>💬 <b>Ask Spotter.</b> "Is my seat height right?" "How do I do a lat pulldown?" Get a plain answer in seconds.</li>
          <li>♾️ <b>Unlimited plan rebuilds.</b></li>
        </ul>
        <div className="mt-6"><p className="mb-3 text-3xl font-black">₹{APP.proPriceInr}<span className="text-base font-semibold text-slate-500">/month</span></p><UpgradeButton /></div>
      </div>
    </div>
  );
  const msgs = (await q<{ role: string; kind: string; content: string }>(`select role, kind, content from coach_messages where user_id = $1 order by id desc limit 30`, [user.id])).reverse();
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight">Spotter Coach</h1>
      <CoachClient initial={msgs} />
    </div>
  );
}
