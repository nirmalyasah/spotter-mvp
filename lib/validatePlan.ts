// Safety net: keep only exercise IDs that really exist in our library.
export function onlyKnownIds(ids: unknown, library: string[]): string[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (typeof id === "string" && library.includes(id)) seen.add(id);
  }
  return [...seen];
}

// A plan is valid only if it has 3 days and each day has at least 2 real exercises.
export function validPlanDays(days: unknown, library: string[]): string[][] | null {
  if (!Array.isArray(days) || days.length < 3) return null;
  const out: string[][] = [];
  for (const d of days.slice(0, 3)) {
    const ids = onlyKnownIds(d?.exerciseIds, library);
    if (ids.length < 2) return null;
    out.push(ids.slice(0, 4));
  }
  return out;
}
