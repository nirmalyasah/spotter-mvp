import { q } from "@/lib/db";
import { apiUser, handle, json } from "@/lib/api";
import { endSession } from "@/lib/auth";

// Delete my account and all my data.
export const DELETE = handle(async () => {
  const user = await apiUser();
  await q(`delete from users where id = $1`, [user.id]); // every other table cascades
  await endSession();
  return json({ ok: true });
});
