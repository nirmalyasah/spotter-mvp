// Plain-code progression rule: hit all reps -> add 2.5 kg, never above the exercise's cap.
export function nextWeight(current: number, hitAllReps: boolean, maxKg: number): number {
  if (!hitAllReps) return current;
  return Math.min(current + 2.5, maxKg);
}

// Comeback sessions start lighter: 80% of current weight, rounded to the nearest 2.5 kg.
export function comebackWeight(current: number): number {
  return Math.max(2.5, Math.round((current * 0.8) / 2.5) * 2.5);
}
