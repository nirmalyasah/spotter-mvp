// Plain-code progression: hit every rep in every set -> add a small step, never above the cap.
export function nextWeight(current: number, hitAllSets: boolean, maxKg: number, step: number): number {
  if (!hitAllSets) return current;
  return Math.min(current + step, maxKg);
}

// Comeback sessions start lighter: 80% of your current weight, rounded to the nearest 2.5 kg.
export function comebackWeight(current: number): number {
  return Math.max(2.5, Math.round((current * 0.8) / 2.5) * 2.5);
}
