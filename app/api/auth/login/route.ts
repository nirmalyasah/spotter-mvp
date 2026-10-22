import { z } from "zod";
import { q } from "@/lib/db";
import { hashCode, normalizeCode, startSession } from "@/lib/auth";
import { body, handle, json } from "@/lib/api";

const schema = z.object({ code: z.string().trim().min(1, "Enter your access code.").max(30) });

// Get back into your account from another device with the access code you were given at sign-up.
export const POST = handle(async (req) => {
  const d = await body<z.infer<typeof schema>>(req, schema);
  if (normalizeCode(d.code).length !== 10) return json({ error: "That code doesn't look right. It has 10 letters and numbers, like K7M2Q-9XAB4." }, 400);
  const u = (await q<{ id: string }>(`select id from users where access_code_hash = $1`, [hashCode(d.code)]))[0];
  if (!u) return json({ error: "We couldn't find an account with that code." }, 401);
  await startSession(u.id);
  return json({ ok: true });
});
