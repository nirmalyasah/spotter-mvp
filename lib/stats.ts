const DAY = 24 * 60 * 60 * 1000;
// Weeks start on Monday (1 Jan 1970 was a Thursday, so shift by 4 days).
export const weekIndex = (t: number) => Math.floor((t - 4 * DAY) / (7 * DAY));

// How many weeks in a row (ending this week, or last week as a grace) had at least one workout.
export function weeklyStreak(dates: number[], now: number): number {
  const weeks = new Set(dates.map(weekIndex));
  let w = weekIndex(now);
  if (!weeks.has(w)) w -= 1;
  let streak = 0;
  while (weeks.has(w)) { streak++; w--; }
  return streak;
}

export const daysSince = (t: number, now: number) => Math.max(0, Math.floor((now - t) / DAY));
