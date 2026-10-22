import { z } from "zod";
import { q } from "@/lib/db";
import { hashPassword, startSession } from "@/lib/auth";
import { body, handle, json } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(60),
  email: z.string().trim().toLowerCase().email("That email doesn't look right."),
  password: z.string().min(8, "Your password needs at least 8 characters.").max(100),
});

export const POST = handle(async (req) => {
  const d = await body<z.infer<typeof schema>>(req, schema);
  const exists = await q(`select 1 from users where email = $1`, [d.email]);
  if (exists.length) return json({ error: "An account with this email already exists. Try logging in." }, 409);
  const row = (await q<{ id: string }>(`insert into users (email, name, password_hash) values ($1,$2,$3) returning id`,
    [d.email, d.name, await hashPassword(d.password)]))[0];
  await startSession(row.id);
  return json({ ok: true });
});
