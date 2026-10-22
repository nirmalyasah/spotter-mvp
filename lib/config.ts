// One place for the numbers you may want to change later (prices, limits).
export const APP = {
  name: "Spotter",
  proPriceInr: 199, // per month, shown on the site and charged by Stripe
  freePlanBuildsPerMonth: 3,
  comebackAfterDays: 3,
  plateauAfterDays: 21,
};

// Demo tools (simulate 3 days, seed history, toggle Pro) are on in development.
// On a live site they stay off unless you set ALLOW_DEMO_TOOLS=1.
export const demoToolsEnabled = () =>
  process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_TOOLS === "1";

export const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
