import { q } from "./db.ts";
import { byId } from "./exercises.ts";
import { getPlan, getProfile } from "./queries.ts";

const DAY = 86400000;

// Pretend time passed: move all of a user's history N days into the past.
export async function shiftHistory(uid: string, days: number) {
  const iv = `${days} days`;
  await q(`update sessions set started_at = started_at - $2::interval, completed_at = completed_at - $2::interval where user_id = $1`, [uid, iv]);
  await q(`update set_logs set logged_at = logged_at - $2::interval where user_id = $1`, [uid, iv]);
  await q(`update plans set created_at = created_at - $2::interval where user_id = $1`, [uid, iv]);
  await q(`update comebacks set created_at = created_at - $2::interval where user_id = $1`, [uid, iv]);
}

// Fill in 6 weeks of believable history. Weights rise for 2 weeks, then stall, so the plateau check has something to find.
export async function seedHistory(uid: string) {
  const plan = await getPlan(uid);
  const profile = await getProfile(uid);
  if (!plan || !profile) throw new Error("no_plan");
  await q(`delete from sessions where user_id = $1`, [uid]);
  await q(`update plans set created_at = now() - interval '43 days' where user_id = $1`, [uid]); // the plan is as old as the history
  const now = Date.now();
  const finalKg: Record<string, number> = {};
  let n = 0;
  for (let week = 6; week >= 1; week--) {
    for (const offset of [0, 2, 4]) {
      const at = now - week * 7 * DAY + offset * DAY - 2 * DAY;
      const dayIndex = n % plan.days.length;
      const ids = plan.days[dayIndex];
      const items = ids.map((id) => {
        const e = byId(id)!;
        const kg = Math.min(e.startKg + e.step * Math.min(6 - week, 2), e.maxKg);
        finalKg[id] = kg;
        return { id, kg, sets: 3, reps: 10 };
      });
      const s = (await q<{ id: string }>(
        `insert into sessions (user_id, kind, day_index, items, started_at, completed_at) values ($1,'regular',$2,$3::text::jsonb,$4,$4) returning id`,
        [uid, dayIndex, JSON.stringify(items), new Date(at)]))[0];
      for (const it of items) {
        const missed = (n + it.id.length) % 4 === 0;
        for (let i = 1; i <= 3; i++) {
          await q(`insert into set_logs (user_id, session_id, exercise_id, set_number, kg, reps, completed, logged_at) values ($1,$2,$3,$4,$5,10,$6,$7)`,
            [uid, s.id, it.id, i, it.kg, !(missed && i === 3), new Date(at)]);
        }
      }
      n++;
    }
  }
  for (const [id, kg] of Object.entries(finalKg)) {
    await q(`insert into user_weights (user_id, exercise_id, kg) values ($1,$2,$3) on conflict (user_id, exercise_id) do update set kg = excluded.kg`, [uid, id, kg]);
  }
  return n;
}
