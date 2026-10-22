import exercises from "./exercises.json";
import type { User } from "./db";
import { comebackWeight } from "./progression";

export const SETS = 3;
export const REPS = 10;
export const REST_SEC = 90;
export const COMEBACK_SETS = 2;
export const COMEBACK_REPS = 8;

export const library = exercises as {
  id: string; name: string; machine: string; setup: string[]; startKg: number; maxKg: number;
}[];
export const libraryIds = library.map((e) => e.id);
export const byId = (id: string) => library.find((e) => e.id === id);

// Turns the saved user into exactly what the screen needs.
export function buildView(user: User | null) {
  if (!user) return { status: "none" as const };
  const inComeback = !!user.comeback;
  const ids = inComeback ? user.comeback!.ids : user.days[0];
  const cursor = inComeback ? user.comeback!.cursor : user.cursor;
  const ex = ids[cursor] ? byId(ids[cursor]) : null;
  const card = ex
    ? {
        id: ex.id,
        name: ex.name,
        machine: ex.machine,
        setup: ex.setup,
        kg: inComeback ? comebackWeight(user.weights[ex.id] ?? ex.startKg) : user.weights[ex.id] ?? ex.startKg,
        sets: inComeback ? COMEBACK_SETS : SETS,
        reps: inComeback ? COMEBACK_REPS : REPS,
        restSec: REST_SEC,
        position: cursor + 1,
        total: ids.length,
      }
    : null;
  return {
    status: "active" as const,
    summary: user.summary,
    welcome: user.welcome,
    fallback: user.fallback,
    comeback: inComeback
      ? { message: user.comeback!.message, email: user.comeback!.email, fallback: user.comeback!.fallback }
      : null,
    card,
    done: !card,
    logsCount: user.logs.length,
  };
}
