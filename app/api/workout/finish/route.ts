import { z } from "zod";
import { apiUser, body, handle, json } from "@/lib/api";
import { finishWorkout } from "@/lib/workout";
import { getStats } from "@/lib/queries";

const schema = z.object({ sessionId: z.string().uuid() });

export const POST = handle(async (req) => {
  const user = await apiUser();
  const d = await body<z.infer<typeof schema>>(req, schema);
  const summary = await finishWorkout(user.id, d.sessionId);
  const stats = await getStats(user.id);
  return json({ ...summary, total: stats.total, streakWeeks: stats.streakWeeks });
});
