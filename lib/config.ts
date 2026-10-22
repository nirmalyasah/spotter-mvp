// One place for the numbers you may want to change later.
export const APP = {
  name: "Spotter",
  comebackAfterDays: 3,
  plateauAfterDays: 21,
};

// Spotter is free for everyone. These daily limits per person only exist to stop abuse of the AI.
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
