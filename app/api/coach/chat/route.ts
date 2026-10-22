import { z } from "zod";
import { q } from "@/lib/db";
import { apiUser, body, handle, json } from "@/lib/api";
import { coachReply } from "@/lib/ai";
import { getProfile, recordAiUse, usageCount } from "@/lib/queries";
import { LIMITS } from "@/lib/config";
import { hasOffLimitsTopic, mentionsRiskyTopic } from "@/lib/safety";

export const maxDuration = 60;
const schema = z.object({ message: z.string().trim().min(2, "Type a question first.").max(500) });
const REFER = "I can't help with that one. For pain, health conditions, diet, drugs or mental health, please talk to a qualified professional (a doctor or a certified trainer). I'm happy to help with machines, form, weights and routines!";

export const POST = handle(async (req) => {
  const user = await apiUser();
  const d = await body<z.infer<typeof schema>>(req, schema);
  if ((await usageCount(user.id, "coach")) >= LIMITS.coachMessagesPerDay) return json({ error: "That's a lot of questions for one day! Please come back tomorrow." }, 429);
  await q(`insert into coach_messages (user_id, role, content) values ($1,'user',$2)`, [user.id, d.message]);
  let reply = REFER;
  if (!mentionsRiskyTopic(d.message)) {
    const profile = await getProfile(user.id);
    if (!profile) return json({ error: "Finish the quick setup first." }, 400);
    const hist = (await q<{ role: string; content: string }>(
      `select role, content from coach_messages where user_id = $1 and kind = 'chat' order by id desc limit 8`, [user.id])).reverse();
    try {
      const out = await coachReply(profile, hist);
      reply = hasOffLimitsTopic(out) ? REFER : out;
      await recordAiUse(user.id, "coach");
    } catch (e) {
      console.error("coach failed:", (e as Error).message);
      reply = "I couldn't reach my brain just now. Please try again in a moment.";
    }
  }
  await q(`insert into coach_messages (user_id, role, content) values ($1,'assistant',$2)`, [user.id, reply]);
  return json({ reply });
});
