import { q } from "./db.ts";
import { byId } from "./exercises.ts";
import { comebackWeight, nextWeight } from "./progression.ts";
import { fallbackDays, nextDayIndex } from "./plan.ts";
import { getPlan, getProfile, getWeights, pendingComeback } from "./queries.ts";
import { FREE } from "./config.ts";

export const SETS = 3, REPS = 10, COMEBACK_SETS = 2, COMEBACK_REPS = 8, REST_SEC = 90;

export type Item = { id: string; kg: number; sets: number; reps: number };
export type Card = Item & { name: string; equipment: string; setup: string[]; tip: string };
export type SessionView = { id: string; kind: "regular" | "comeback"; title: string; message?: string; cards: Card[]; doneIds: string[]; restSec: number };

export const toCard = (it: Item): Card | null => {
  const e = byId(it.id);
  return e ? { ...it, name: e.name, equipment: e.equipment, setup: e.setup, tip: e.tip } : null;
};

async function view(row: { id: string; kind: string; items: Item[] }, message?: string): Promise<SessionView> {
  const done = await q<{ exercise_id: string }>(`select distinct exercise_id from set_logs where session_id = $1`, [row.id]);
  return {
    id: row.id, kind: row.kind as "regular" | "comeback",
    title: row.kind === "comeback" ? "Your comeback session" : "Today's workout",
    message, cards: row.items.map(toCard).filter(Boolean) as Card[],
    doneIds: done.map((d) => d.exercise_id), restSec: REST_SEC,
  };
}

// Starts today's workout (or a comeback session, or resumes one you left open in the last 12 hours).
export async function startWorkout(uid: string, paid = true): Promise<SessionView> {
  const profile = await getProfile(uid);
  if (!profile) throw new Error("no_profile");
  if (profile.flagged) throw new Error("flagged");

  const open = (await q<{ id: string; kind: string; items: Item[] }>(
    `select id, kind, items from sessions where user_id = $1 and completed_at is null
     and started_at > now() - interval '12 hours' order by started_at desc limit 1`, [uid]))[0];
  if (open) {
    let message: string | undefined;
    if (open.kind === "comeback") {
      message = (await q<{ message: string }>(`select message from comebacks where user_id = $1 and consumed_at is not null order by consumed_at desc limit 1`, [uid]))[0]?.message;
    }
    return view(open, message);
  }

  // The free trial covers your first few workouts. After that, Spotter Plus.
  if (!paid) {
    const done = (await q<{ n: number }>(`select count(*)::int as n from sessions where user_id = $1 and completed_at is not null`, [uid]))[0].n;
    if (done >= FREE.workouts) throw new Error("paywall");
  }

  const weights = await getWeights(uid);
  const cb = await pendingComeback(uid);
  if (cb) {
    const ids: string[] = (await q<{ items: string[] }>(`select items from comebacks where id = $1`, [cb.id]))[0].items;
    const items: Item[] = ids.filter((id) => byId(id)).map((id) => ({ id, kg: comebackWeight(weights[id] ?? byId(id)!.startKg), sets: COMEBACK_SETS, reps: COMEBACK_REPS }));
    const row = (await q<{ id: string }>(
      `insert into sessions (user_id, kind, items) values ($1, 'comeback', $2::text::jsonb) returning id`, [uid, JSON.stringify(items)]))[0];
    await q(`update comebacks set consumed_at = now() where id = $1`, [cb.id]);
    return view({ id: row.id, kind: "comeback", items }, cb.message);
  }

  const plan = await getPlan(uid);
  if (!plan) throw new Error("no_plan");
  const completed = (await q<{ n: number }>(`select count(*)::int as n from sessions where user_id = $1 and kind = 'regular' and completed_at is not null`, [uid]))[0].n;
  const dayIndex = nextDayIndex(completed, plan.days.length);
  let ids = plan.days[dayIndex].filter((id) => profile.available_ids.includes(id));
  if (ids.length < 2) ids = (fallbackDays(profile.available_ids) ?? plan.days)[dayIndex] ?? plan.days[dayIndex];
  const items: Item[] = ids.filter((id) => byId(id)).map((id) => ({ id, kg: weights[id] ?? byId(id)!.startKg, sets: SETS, reps: REPS }));
  const row = (await q<{ id: string }>(
    `insert into sessions (user_id, kind, day_index, items) values ($1, 'regular', $2, $3::text::jsonb) returning id`, [uid, dayIndex, JSON.stringify(items)]))[0];
  return view({ id: row.id, kind: "regular", items });
}

// Saves one finished exercise and applies the progression rule. Safe to call only once per exercise.
export async function logExercise(uid: string, sessionId: string, exerciseId: string, setsCompleted: number) {
  const s = (await q<{ kind: string; items: Item[]; completed_at: Date | null }>(
    `select kind, items, completed_at from sessions where id = $1 and user_id = $2`, [sessionId, uid]))[0];
  if (!s || s.completed_at) throw new Error("bad_session");
  const item = s.items.find((i) => i.id === exerciseId);
  if (!item) throw new Error("bad_exercise");
  const already = await q(`select 1 from set_logs where session_id = $1 and exercise_id = $2 limit 1`, [sessionId, exerciseId]);
  if (already.length) throw new Error("already_logged");
  const n = Math.max(0, Math.min(item.sets, Math.floor(setsCompleted)));
  for (let i = 1; i <= item.sets; i++) {
    await q(`insert into set_logs (user_id, session_id, exercise_id, set_number, kg, reps, completed) values ($1,$2,$3,$4,$5,$6,$7)`,
      [uid, sessionId, exerciseId, i, item.kg, item.reps, i <= n]);
  }
  const perfect = n === item.sets;
  let newKg = item.kg, increased = false;
  if (s.kind === "regular") {
    const e = byId(exerciseId)!;
    newKg = nextWeight(item.kg, perfect, e.maxKg, e.step);
    increased = newKg > item.kg;
    if (increased) {
      await q(`insert into user_weights (user_id, exercise_id, kg, last_increase_at) values ($1,$2,$3, now())
               on conflict (user_id, exercise_id) do update set kg = excluded.kg, last_increase_at = now()`, [uid, exerciseId, newKg]);
    }
  }
  return { perfect, increased, newKg, kind: s.kind };
}

export async function finishWorkout(uid: string, sessionId: string) {
  await q(`update sessions set completed_at = coalesce(completed_at, now()) where id = $1 and user_id = $2`, [sessionId, uid]);
  const r = (await q<{ exercises: number; volume: number; perfect: number }>(
    `select count(distinct exercise_id)::int as exercises,
            coalesce(sum(case when completed then kg * reps else 0 end),0)::float as volume,
            0 as perfect
     from set_logs where session_id = $1`, [sessionId]))[0];
  return { exercises: r.exercises, volume: Math.round(Number(r.volume)) };
}
