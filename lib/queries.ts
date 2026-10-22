import { q } from "./db.ts";
import { daysSince, weeklyStreak, weekIndex } from "./stats.ts";
import type { Result } from "./plateau.ts";

export type Profile = {
  user_id: string; goal: string; days_per_week: number; age: number; gym: string; nervous: string;
  summary: string; welcome: string; available_ids: string[]; flagged: string | null;
};

export async function getProfile(uid: string): Promise<Profile | null> {
  return (await q<Profile>(`select * from profiles where user_id = $1`, [uid]))[0] ?? null;
}

export async function getPlan(uid: string) {
  return (await q<{ id: string; days: string[][]; fallback: boolean; created_at: Date }>(
    `select id, days, fallback, created_at from plans where user_id = $1 order by created_at desc limit 1`, [uid]))[0] ?? null;
}

export async function getWeights(uid: string): Promise<Record<string, number>> {
  const rows = await q<{ exercise_id: string; kg: number }>(`select exercise_id, kg from user_weights where user_id = $1`, [uid]);
  return Object.fromEntries(rows.map((r) => [r.exercise_id, Number(r.kg)]));
}

export async function lastActivityMs(uid: string): Promise<number> {
  const r = await q<{ t: Date }>(
    `select greatest(
       coalesce((select max(started_at) from sessions where user_id = $1), 'epoch'::timestamptz),
       coalesce((select max(created_at) from plans where user_id = $1), 'epoch'::timestamptz)) as t`, [uid]);
  return new Date(r[0].t).getTime();
}

export async function pendingComeback(uid: string) {
  return (await q<{ id: string; message: string; email_text: string; days_missed: number; ai: boolean; created_at: Date }>(
    `select id, message, email_text, days_missed, ai, created_at from comebacks
     where user_id = $1 and consumed_at is null order by created_at desc limit 1`, [uid]))[0] ?? null;
}

export async function completedSessionDates(uid: string): Promise<number[]> {
  const rows = await q<{ completed_at: Date }>(
    `select completed_at from sessions where user_id = $1 and completed_at is not null order by completed_at`, [uid]);
  return rows.map((r) => new Date(r.completed_at).getTime());
}

export async function getStats(uid: string, now = Date.now()) {
  const dates = await completedSessionDates(uid);
  const thisWeek = dates.filter((d) => weekIndex(d) === weekIndex(now)).length;
  const last = await lastActivityMs(uid);
  return { total: dates.length, thisWeek, streakWeeks: weeklyStreak(dates, now), daysSince: daysSince(last, now), dates };
}

// One row per (session, exercise) for normal sessions: the weight used and whether every set was done.
export async function exerciseResults(uid: string): Promise<Result[]> {
  const rows = await q<{ exercise_id: string; kg: number; all_done: boolean; at: Date }>(
    `select l.exercise_id, max(l.kg) as kg, bool_and(l.completed) as all_done, min(l.logged_at) as at
     from set_logs l join sessions s on s.id = l.session_id
     where l.user_id = $1 and s.kind = 'regular'
     group by s.id, l.exercise_id order by min(l.logged_at)`, [uid]);
  return rows.map((r) => ({ exerciseId: r.exercise_id, kg: Number(r.kg), allDone: r.all_done, at: new Date(r.at).getTime() }));
}

export async function recentSessions(uid: string, limit = 8) {
  const rows = await q<{ id: string; kind: string; completed_at: Date; exercises: number; volume: number }>(
    `select s.id, s.kind, s.completed_at, count(distinct l.exercise_id)::int as exercises,
            coalesce(sum(case when l.completed then l.kg * l.reps else 0 end), 0)::float as volume
     from sessions s left join set_logs l on l.session_id = s.id
     where s.user_id = $1 and s.completed_at is not null
     group by s.id order by s.completed_at desc limit $2`, [uid, limit]);
  return rows.map((r) => ({ ...r, completed_at: new Date(r.completed_at).toISOString(), volume: Number(r.volume) }));
}

export async function aiUsageThisMonth(uid: string, kind: string) {
  const r = await q<{ n: number }>(
    `select count(*)::int as n from ai_usage where user_id = $1 and kind = $2 and created_at > now() - interval '30 days'`, [uid, kind]);
  return r[0].n;
}
export const recordAiUse = (uid: string, kind: string) => q(`insert into ai_usage (user_id, kind) values ($1, $2)`, [uid, kind]);
