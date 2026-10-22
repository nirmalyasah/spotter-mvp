import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import CoachClient from "@/app/components/CoachClient";

export const metadata = { title: "Coach" };

export default async function Coach() {
  const user = await requireUser();
  const msgs = (await q<{ role: string; kind: string; content: string }>(`select role, kind, content from coach_messages where user_id = $1 order by id desc limit 30`, [user.id])).reverse();
  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-black tracking-tight">Spotter Coach</h1><p className="mt-1 text-slate-600">Ask about a machine, your form or your weights, or check why a lift has stalled.</p></div>
      <CoachClient initial={msgs} />
    </div>
  );
}
