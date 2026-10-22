import { EXERCISES, type Exercise } from "./exercises.ts";

export const MIN_EXERCISES = 6; // a plan needs at least this many machines/weights to work with

export function onlyKnownIds(ids: unknown, allowed: string[]): string[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  for (const id of ids) if (typeof id === "string" && allowed.includes(id)) seen.add(id);
  return [...seen];
}

// Keep the AI's plan only if it has 3 days with at least 2 real, available exercises each.
export function validDays(days: unknown, allowed: string[]): string[][] | null {
  if (!Array.isArray(days) || days.length < 3) return null;
  const out: string[][] = [];
  for (const d of days.slice(0, 3)) {
    const ids = onlyKnownIds((d as any)?.exerciseIds, allowed);
    if (ids.length < 2) return null;
    out.push(ids.slice(0, 5));
  }
  return out;
}

// A standard full-body plan: each day has legs + push + pull, easiest machines first.
export function fallbackDays(allowed: string[]): string[][] | null {
  const pool = EXERCISES.filter((e) => allowed.includes(e.id)).sort((a, b) => a.level - b.level);
  if (pool.length < MIN_EXERCISES) return null;
  const group = (m: Exercise["muscle"]) => pool.filter((e) => e.muscle === m);
  const [legs, push, pull] = [group("legs"), group("push"), group("pull")];
  const days: string[][] = [];
  for (let i = 0; i < 3; i++) {
    const day: string[] = [];
    for (const g of [legs, push, pull]) if (g.length) day.push(g[i % g.length].id);
    const extra = pool[(i * 2 + 3) % pool.length];
    if (extra && !day.includes(extra.id)) day.push(extra.id);
    days.push(day);
  }
  return days.every((d) => d.length >= 2) ? days : null;
}

export const nextDayIndex = (completedRegularSessions: number, daysInPlan: number) =>
  daysInPlan > 0 ? completedRegularSessions % daysInPlan : 0;
