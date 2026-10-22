import test from "node:test";
import assert from "node:assert/strict";
import { checkSafety, validateText } from "../lib/safety.ts";
import { nextWeight, comebackWeight } from "../lib/progression.ts";
import { fallbackDays, validDays, onlyKnownIds, nextDayIndex } from "../lib/plan.ts";
import { findPlateaus } from "../lib/plateau.ts";
import { weeklyStreak, weekIndex } from "../lib/stats.ts";
import { EXERCISE_IDS } from "../lib/exercises.ts";

const DAY = 86400000;

test("age limits are held for a trainer", () => {
  assert.equal(checkSafety(16, ["x"]).ok, false);
  assert.equal(checkSafety(62, ["x"]).ok, false);
  assert.equal(checkSafety(24, ["x"]).ok, true);
});
test("normal beginner worries are NOT blocked", () => {
  for (const t of ["I'm scared I'll get hurt using the machines", "no pain no gain right", "a stronger heart and better condition",
    "improve my diet and fitness", "I'm afraid of injury", "gym anxiety, I feel completely lost"])
    assert.equal(checkSafety(24, [t]).ok, true, t);
});
test("real health problems and risky topics ARE blocked", () => {
  for (const t of ["my back hurts", "my lower back is sore", "I have asthma", "I'm injured", "I had knee surgery", "knee pain when I squat",
    "doctor told me to be careful", "I have a heart condition", "I want to take steroids", "give me a meal plan", "I feel depressed"])
    assert.equal(checkSafety(24, [t]).ok, false, t);
});
test("blank and nonsense text is rejected", () => {
  assert.ok(validateText("  ")); assert.ok(validateText("??")); assert.equal(validateText("get stronger"), null);
});
test("progression adds a step, respects the cap and failure", () => {
  assert.equal(nextWeight(20, true, 60, 2.5), 22.5);
  assert.equal(nextWeight(20, false, 60, 2.5), 20);
  assert.equal(nextWeight(60, true, 60, 2.5), 60);
  assert.equal(comebackWeight(22.5), 17.5);
});
test("fallback plan: 3 days, each with legs/push/pull, only available exercises", () => {
  const days = fallbackDays(EXERCISE_IDS)!;
  assert.equal(days.length, 3);
  for (const d of days) assert.ok(d.length >= 3);
  const few = EXERCISE_IDS.slice(0, 8);
  for (const d of fallbackDays(few)!) for (const id of d) assert.ok(few.includes(id));
  assert.equal(fallbackDays(EXERCISE_IDS.slice(0, 3)), null);
});
test("AI plans with invented exercises are rejected", () => {
  assert.deepEqual(onlyKnownIds(["chest-press", "fake", "chest-press"], EXERCISE_IDS), ["chest-press"]);
  const bad = [{ exerciseIds: ["chest-press", "fake"] }, { exerciseIds: ["leg-press", "seated-row"] }, { exerciseIds: ["leg-curl", "pec-deck"] }];
  assert.equal(validDays(bad, EXERCISE_IDS), null);
  const good = [{ exerciseIds: ["chest-press", "leg-press"] }, { exerciseIds: ["leg-press", "seated-row"] }, { exerciseIds: ["leg-curl", "pec-deck"] }];
  assert.equal(validDays(good, EXERCISE_IDS)!.length, 3);
});
test("next workout day cycles through the plan", () => {
  assert.equal(nextDayIndex(0, 3), 0); assert.equal(nextDayIndex(4, 3), 1);
});
test("plateau: same weight for 3+ weeks and 3+ sessions", () => {
  const now = 100 * DAY;
  const flat = [0, 7, 14, 21, 28].map((d, i) => ({ exerciseId: "chest-press", kg: 30, allDone: i % 2 === 0, at: now - (28 - d) * DAY - 0 }));
  // oldest at now-28d ... newest at now
  const p = findPlateaus(flat, now);
  assert.equal(p.length, 1); assert.equal(p[0].weeks, 4); assert.equal(p[0].sessions, 5);
  const rising = [20, 22.5, 25, 27.5].map((kg, i) => ({ exerciseId: "x", kg, allDone: true, at: now - (21 - i * 7) * DAY }));
  assert.equal(findPlateaus(rising, now).length, 0);
  const recent = [30, 30, 30].map((kg, i) => ({ exerciseId: "y", kg, allDone: true, at: now - (6 - i * 3) * DAY }));
  assert.equal(findPlateaus(recent, now).length, 0);
});
test("weekly streak counts consecutive weeks, with a grace for the current week", () => {
  const now = Date.UTC(2026, 9, 22); // Thu 22 Oct 2026
  const w = (n: number) => now - n * 7 * DAY;
  assert.equal(weeklyStreak([], now), 0);
  assert.equal(weeklyStreak([w(0), w(1), w(2)], now), 3);
  assert.equal(weeklyStreak([w(1), w(2)], now), 2); // nothing yet this week: streak still alive
  assert.equal(weeklyStreak([w(0), w(2)], now), 1); // gap breaks it
  assert.equal(weekIndex(Date.UTC(2026, 9, 19)), weekIndex(Date.UTC(2026, 9, 25))); // Mon..Sun same week
});
