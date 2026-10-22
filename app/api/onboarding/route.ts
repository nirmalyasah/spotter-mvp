import { z } from "zod";
import { q } from "@/lib/db";
import { apiUser, body, handle, json } from "@/lib/api";
import { checkSafety, validateText } from "@/lib/safety";
import { EXERCISE_IDS } from "@/lib/exercises";
import { fallbackDays, MIN_EXERCISES, onlyKnownIds, validDays } from "@/lib/plan";
import { buildPlan } from "@/lib/ai";
import { hasOffLimitsTopic } from "@/lib/safety";
import { recordAiUse, usageCount } from "@/lib/queries";
import { LIMITS } from "@/lib/config";
import { EXERCISES } from "@/lib/exercises";

export const maxDuration = 60;

const schema = z.object({
  goal: z.string().trim().max(300), days: z.coerce.number().int().min(1).max(7), age: z.coerce.number().int().min(10).max(100),
  gym: z.string().trim().max(100), nervous: z.string().trim().max(500),
  availableIds: z.array(z.string()).optional(), forceStandard: z.boolean().optional(),
});

export const POST = handle(async (req) => {
  const user = await apiUser();
  const d = await body<z.infer<typeof schema>>(req, schema);
  for (const t of [d.goal, d.gym, d.nervous]) { const e = validateText(t); if (e) return json({ error: e }, 400); }
  const available = onlyKnownIds(d.availableIds ?? EXERCISE_IDS, EXERCISE_IDS);
  if (available.length < MIN_EXERCISES) return json({ error: `Please tick at least ${MIN_EXERCISES} machines or weights your gym has.` }, 400);

  // 1. Safety rules run before any AI. A flag means no plan.
  const safety = checkSafety(d.age, [d.goal, d.gym, d.nervous]);
  const base = [user.id, d.goal, d.days, d.age, d.gym, d.nervous, JSON.stringify(available)];
  if (!safety.ok) {
    await q(`insert into profiles (user_id, goal, days_per_week, age, gym, nervous, available_ids, flagged) values ($1,$2,$3,$4,$5,$6,$7::text::jsonb,$8)
             on conflict (user_id) do update set flagged = excluded.flagged, updated_at = now()`, [...base, safety.message]);
    return json({ status: "blocked", message: safety.message });
  }

  // 2. Fair use: Spotter is free, so the AI has a generous daily limit per person.
  if ((await usageCount(user.id, "plan")) >= LIMITS.planBuildsPerDay) {
    return json({ error: "You've rebuilt your plan a lot today. Please try again tomorrow." }, 429);
  }

  // 3. Ask the AI, then check everything it says. Anything off -> standard plan.
  let days: string[][] | null = null, summary = "You're new to the gym and want a clear plan to follow.", welcome = "Let's start easy. You've got this.", fallback = true;
  if (!d.forceStandard) {
    try {
      const out = await buildPlan({ goal: d.goal, days_per_week: d.days, age: d.age, gym: d.gym, nervous: d.nervous }, available);
      days = validDays(out.days, available);
      if (days && !hasOffLimitsTopic(`${out.summary} ${out.welcome}`)) { summary = out.summary; welcome = out.welcome; fallback = false; } else days = null;
    } catch (e) { console.error("AI plan failed:", (e as Error).message); }
  }
  if (!days) days = fallbackDays(available);
  if (!days) return json({ error: "We couldn't build a plan from those machines. Tick a few more." }, 400);

  await q(`insert into profiles (user_id, goal, days_per_week, age, gym, nervous, summary, welcome, available_ids, flagged) values ($1,$2,$3,$4,$5,$6,$8,$9,$7::text::jsonb,null)
           on conflict (user_id) do update set goal=excluded.goal, days_per_week=excluded.days_per_week, age=excluded.age, gym=excluded.gym,
           nervous=excluded.nervous, summary=excluded.summary, welcome=excluded.welcome, available_ids=excluded.available_ids, flagged=null, updated_at=now()`,
    [...base, summary, welcome]);
  await q(`insert into plans (user_id, days, fallback) values ($1,$2::text::jsonb,$3)`, [user.id, JSON.stringify(days), fallback]);
  for (const e of EXERCISES) {
    await q(`insert into user_weights (user_id, exercise_id, kg) values ($1,$2,$3) on conflict do nothing`, [user.id, e.id, e.startKg]);
  }
  await recordAiUse(user.id, "plan");
  return json({ status: "ok", fallback });
});
