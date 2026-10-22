import { z } from "zod";
import { apiUser, body, handle, json } from "@/lib/api";
import { generateComeback } from "@/lib/comeback";
import { LIMITS } from "@/lib/config";
import { usageCount } from "@/lib/queries";
import { getAccess } from "@/lib/access";

export const maxDuration = 60;
const schema = z.object({ reason: z.string().trim().max(300).optional() });

// "I'm back" button: if you've been away 3+ days and the daily job hasn't made a comeback yet, make one now.
export const POST = handle(async (req) => {
  const user = await apiUser();
  const d = await body<z.infer<typeof schema>>(req, schema);
  const access = await getAccess(user.id, user.plan);
  if (!access.paid && access.workoutsLeft === 0) return json({ error: "You've used your free workouts. Spotter Plus keeps you going every day.", code: "upgrade" }, 402);
  if ((await usageCount(user.id, "comeback")) >= LIMITS.comebacksPerDay) return json({ error: "Please try again tomorrow." }, 429);
  const id = await generateComeback(user.id, { reason: d.reason });
  return id ? json({ ok: true }) : json({ error: "You're on track! No comeback needed yet." }, 400);
});
