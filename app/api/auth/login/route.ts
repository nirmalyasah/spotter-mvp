import { z } from "zod";
import { q } from "@/lib/db";
import { startSession, verifyPassword } from "@/lib/auth";
import { body, handle, json } from "@/lib/api";

const schema = z.object({ email: z.string().trim().toLowerCase().email("That email doesn't look right."), password: z.string().min(1, "Enter your password.") });

export const POST = handle(async (req) => {
  const d = await body<z.infer<typeof schema>>(req, schema);
  const u = (await q<{ id: string; password_hash: string }>(`select id, password_hash from users where email = $1`, [d.email]))[0];
  // Same message for "no such user" and "wrong password" so nobody can probe for accounts.
  if (!u || !(await verifyPassword(d.password, u.password_hash))) return json({ error: "Wrong email or password." }, 401);
  await startSession(u.id);
  return json({ ok: true });
});
