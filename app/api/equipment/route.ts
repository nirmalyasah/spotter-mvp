import { z } from "zod";
import { q } from "@/lib/db";
import { apiUser, body, handle, json } from "@/lib/api";
import { EXERCISE_IDS } from "@/lib/exercises";
import { MIN_EXERCISES, onlyKnownIds } from "@/lib/plan";

const schema = z.object({ availableIds: z.array(z.string()) });

export const PATCH = handle(async (req) => {
  const user = await apiUser();
  const d = await body<z.infer<typeof schema>>(req, schema);
  const ids = onlyKnownIds(d.availableIds, EXERCISE_IDS);
  if (ids.length < MIN_EXERCISES) return json({ error: `Tick at least ${MIN_EXERCISES} machines or weights.` }, 400);
  await q(`update profiles set available_ids = $2::text::jsonb, updated_at = now() where user_id = $1`, [user.id, JSON.stringify(ids)]);
  return json({ ok: true });
});
