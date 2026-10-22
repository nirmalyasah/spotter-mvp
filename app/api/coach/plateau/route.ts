import { q } from "@/lib/db";
import { apiUser, handle, json } from "@/lib/api";
import { diagnosePlateau } from "@/lib/ai";
import { findPlateaus } from "@/lib/plateau";
import { exerciseResults, getProfile, recordAiUse, usageCount } from "@/lib/queries";
import { byId } from "@/lib/exercises";
import { APP, LIMITS } from "@/lib/config";
import { hasOffLimitsTopic } from "@/lib/safety";
import { isPaid } from "@/lib/access";

export const maxDuration = 60;

// Rule flags it (no weight increase for 3+ weeks); the AI explains why and what to try.
export const POST = handle(async () => {
  const user = await apiUser();
  if (!isPaid(user.plan)) return json({ error: "The plateau check is part of Spotter Plus.", code: "upgrade" }, 402);
  const profile = await getProfile(user.id);
  if (!profile) return json({ error: "Finish the quick setup first." }, 400);
  if ((await usageCount(user.id, "plateau")) >= LIMITS.plateauChecksPerDay) return json({ error: "You've checked a lot today. Try again tomorrow." }, 429);
  const plateaus = findPlateaus(await exerciseResults(user.id), Date.now(), APP.plateauAfterDays);
  if (!plateaus.length) return json({ flagged: [], text: "Good news: no plateaus. Your weights have gone up recently, or you haven't repeated a lift enough times yet. Keep showing up!" });

  const facts = plateaus.map((p) => `- ${byId(p.exerciseId)?.name}: stuck at ${p.kg} kg for ${p.weeks} weeks over ${p.sessions} sessions (${p.misses} with missed reps)`).join("\n");
  let text = "Your weight hasn't gone up in a few weeks. Try: (1) add the smallest weight you can instead of a big jump, (2) rest 2 minutes between sets, (3) check your form with a trainer at your gym.";
  try {
    const out = await diagnosePlateau(profile, facts);
    if (!hasOffLimitsTopic(out)) text = out;
    await recordAiUse(user.id, "plateau");
  } catch (e) { console.error("plateau AI failed:", (e as Error).message); }
  await q(`insert into coach_messages (user_id, role, kind, content) values ($1,'assistant','plateau',$2)`, [user.id, text]);
  return json({ flagged: plateaus.map((p) => ({ name: byId(p.exerciseId)?.name, kg: p.kg, weeks: p.weeks })), text });
});
