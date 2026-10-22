// One place for the numbers you may want to change later.
export const APP = {
  name: "Spotter",
  plusPriceInr: 199, // planned monthly price, shown as "coming soon" (no payments are switched on)
  comebackAfterDays: 3,
  plateauAfterDays: 21,
};

// What a new person gets for free, once. After this they need Spotter Plus to keep going.
export const FREE = {
  workouts: Number(process.env.FREE_WORKOUTS) || 3, // one full lap of the 3-day plan
  coachQuestions: Number(process.env.FREE_COACH_QUESTIONS) || 5,
  planBuilds: Number(process.env.FREE_PLAN_BUILDS) || 2,
};

// Fair-use limits for everyone, paid or not. They only exist to stop abuse of the AI.
export const LIMITS = {
  planBuildsPerDay: 10,
  coachMessagesPerDay: 40,
  plateauChecksPerDay: 10,
  comebacksPerDay: 3,
  signupsPerHourPerNetwork: Number(process.env.SIGNUP_LIMIT_PER_HOUR) || 8,
};

// Demo tools (pretend 3 days passed, add 6 weeks of history) are on in development.
// On a live site they stay off unless you set ALLOW_DEMO_TOOLS=1.
export const demoToolsEnabled = () =>
  process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_TOOLS === "1";
