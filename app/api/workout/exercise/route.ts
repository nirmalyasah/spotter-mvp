import { z } from "zod";
import { apiUser, body, handle, json } from "@/lib/api";
import { logExercise } from "@/lib/workout";

const schema = z.object({ sessionId: z.string().uuid(), exerciseId: z.string().min(1).max(60), setsCompleted: z.number().int().min(0).max(10) });

export const POST = handle(async (req) => {
  const user = await apiUser();
  const d = await body<z.infer<typeof schema>>(req, schema);
  try {
    return json(await logExercise(user.id, d.sessionId, d.exerciseId, d.setsCompleted));
  } catch (e) {
    const m = (e as Error).message;
    if (["bad_session", "bad_exercise"].includes(m)) return json({ error: "That workout isn't available any more." }, 400);
    if (m === "already_logged") return json({ error: "Already saved." }, 409);
    throw e;
  }
});
