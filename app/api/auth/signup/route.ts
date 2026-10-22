import { z } from "zod";
import { q } from "@/lib/db";
import { hashCode, hashIp, newAccessCode, startSession } from "@/lib/auth";
import { body, clientIp, handle, json } from "@/lib/api";
import { LIMITS } from "@/lib/config";

const schema = z.object({ name: z.string().trim().min(1, "Please tell us what to call you.").max(40, "That name is a bit long.") });

// Sign-up needs only a name. We hand back a one-time access code for getting in from another device.
export const POST = handle(async (req) => {
  const d = await body<z.infer<typeof schema>>(req, schema);
  const ip = hashIp(clientIp(req));
  const recent = (await q<{ n: number }>(`select count(*)::int as n from users where ip_hash = $1 and created_at > now() - interval '1 hour'`, [ip]))[0].n;
  if (recent >= LIMITS.signupsPerHourPerNetwork) return json({ error: "Lots of sign-ups from your network just now. Please try again in a little while." }, 429);
  const code = newAccessCode();
  const row = (await q<{ id: string }>(`insert into users (name, access_code_hash, ip_hash) values ($1,$2,$3) returning id`, [d.name, hashCode(code), ip]))[0];
  await startSession(row.id);
  return json({ ok: true, name: d.name, code });
});
