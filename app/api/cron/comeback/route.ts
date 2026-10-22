import { q } from "@/lib/db";
import { generateComeback } from "@/lib/comeback";
import { APP } from "@/lib/config";

export const maxDuration = 60;

// Runs once a day (see vercel.json). Finds people with no workout in 3 days and writes each a comeback session.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("unauthorized", { status: 401 });
  const users = await q<{ user_id: string }>(
    `select p.user_id from profiles p
     where p.flagged is null and exists (select 1 from plans pl where pl.user_id = p.user_id)
       and not exists (select 1 from comebacks c where c.user_id = p.user_id and (c.consumed_at is null or c.created_at > now() - interval '7 days'))
       and greatest(coalesce((select max(started_at) from sessions s where s.user_id = p.user_id), 'epoch'::timestamptz),
                    (select max(created_at) from plans pl where pl.user_id = p.user_id)) < now() - ($1 || ' days')::interval
     limit 15`, [String(APP.comebackAfterDays)]);
  let made = 0;
  for (let i = 0; i < users.length; i += 5) {
    const batch = await Promise.all(users.slice(i, i + 5).map((u) => generateComeback(u.user_id).catch(() => null)));
    made += batch.filter(Boolean).length;
  }
  return Response.json({ checked: users.length, created: made });
}
