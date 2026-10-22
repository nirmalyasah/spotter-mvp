import { q } from "@/lib/db";
import { apiUser, handle, json } from "@/lib/api";

// Spotter Plus isn't on sale yet. This just remembers who wants it. No payment, no email needed.
export const POST = handle(async () => {
  const user = await apiUser();
  await q(`insert into waitlist (user_id) values ($1) on conflict do nothing`, [user.id]);
  return json({ ok: true });
});

export const GET = handle(async () => {
  const user = await apiUser();
  const r = await q(`select 1 from waitlist where user_id = $1`, [user.id]);
  return json({ joined: r.length > 0 });
});
