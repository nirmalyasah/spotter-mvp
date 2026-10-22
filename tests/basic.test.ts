import test from "node:test";
import assert from "node:assert/strict";
import { checkSafety, validateAnswer } from "../lib/safety.ts";
import { nextWeight } from "../lib/progression.ts";
import { onlyKnownIds, validPlanDays } from "../lib/validatePlan.ts";

test("under 18 and over 55 are held for a trainer", () => {
  assert.equal(checkSafety(16, ["x"]).ok, false);
  assert.equal(checkSafety(62, ["x"]).ok, false);
  assert.equal(checkSafety(24, ["I'm scared and don't know the machines"]).ok, true);
});
test("pain is blocked", () => assert.equal(checkSafety(16 + 8, ["my back hurts"]).ok, false));
test("gym anxiety alone is NOT blocked", () => assert.equal(checkSafety(24, ["I have gym anxiety"]).ok, true));
test("blank and nonsense answers are rejected", () => {
  assert.ok(validateAnswer("goal", "   "));
  assert.ok(validateAnswer("goal", "??"));
  assert.ok(validateAnswer("age", "abc"));
  assert.equal(validateAnswer("age", "24"), null);
});
test("progression adds 2.5kg, respects the cap", () => {
  assert.equal(nextWeight(20, true, 60), 22.5);
  assert.equal(nextWeight(20, false, 60), 20);
  assert.equal(nextWeight(60, true, 60), 60);
});
test("invented exercises are rejected", () => {
  const lib = ["a", "b", "c"];
  assert.deepEqual(onlyKnownIds(["a", "zzz", "a"], lib), ["a"]);
  assert.equal(validPlanDays([{ exerciseIds: ["a", "zzz"] }, { exerciseIds: ["a", "b"] }, { exerciseIds: ["b", "c"] }], lib), null);
});

test("normal beginner worries are NOT blocked", () => {
  for (const t of [
    "I'm scared I'll get hurt using the machines",
    "worried about looking stupid, no pain no gain right",
    "I want a stronger heart and better condition",
    "I want to improve my diet and fitness",
    "I'm afraid of injury",
    "gym anxiety, I feel completely lost",
  ]) assert.equal(checkSafety(24, [t]).ok, true, t);
});
test("real health problems and risky topics ARE blocked", () => {
  for (const t of [
    "my back hurts", "my lower back is sore", "I have asthma", "I'm injured", "I had knee surgery",
    "knee pain when I squat", "doctor told me to be careful", "I have a heart condition",
    "I want to take steroids", "give me a meal plan", "I feel depressed",
  ]) assert.equal(checkSafety(24, [t]).ok, false, t);
});
