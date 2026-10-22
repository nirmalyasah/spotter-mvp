const DAY = 24 * 60 * 60 * 1000;

export type Result = { exerciseId: string; kg: number; allDone: boolean; at: number };
export type Plateau = { exerciseId: string; kg: number; weeks: number; sessions: number; misses: number };

// A plateau = the weight hasn't gone up for 3+ weeks across 3+ sessions.
export function findPlateaus(results: Result[], now: number, minDays = 21, minSessions = 3): Plateau[] {
  const byExercise = new Map<string, Result[]>();
  for (const r of results) byExercise.set(r.exerciseId, [...(byExercise.get(r.exerciseId) ?? []), r]);
  const out: Plateau[] = [];
  for (const [exerciseId, list] of byExercise) {
    list.sort((a, b) => a.at - b.at);
    const latest = list[list.length - 1].kg;
    let start = list.length - 1;
    while (start > 0 && list[start - 1].kg === latest) start--;
    const run = list.slice(start);
    const days = (now - run[0].at) / DAY;
    if (run.length >= minSessions && days >= minDays) {
      out.push({ exerciseId, kg: latest, weeks: Math.floor(days / 7), sessions: run.length, misses: run.filter((r) => !r.allDone).length });
    }
  }
  return out;
}
