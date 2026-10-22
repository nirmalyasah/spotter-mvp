import { z } from "zod";
import { q } from "@/lib/db";
import { apiUser, body, handle, json } from "@/lib/api";

const schema = z.object({ exerciseId: z.string().min(1).max(60), note: z.string().trim().max(500).optional() });

// "This is wrong" button: a report that goes to a human to check the exercise library.
export const POST = handle(async (req) => {
  const user = await apiUser();
  const d = await body<z.infer<typeof schema>>(req, schema);
  await q(`insert into reports (user_id, exercise_id, note) values ($1,$2,$3)`, [user.id, d.exerciseId, d.note ?? ""]);
  return json({ ok: true });
});
