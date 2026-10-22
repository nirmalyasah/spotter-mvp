import { z } from "zod";
import { q } from "@/lib/db";
import { apiUser, body, handle, json } from "@/lib/api";
import { demoToolsEnabled } from "@/lib/config";
import { seedHistory, shiftHistory } from "@/lib/demo";
import { generateComeback } from "@/lib/comeback";
import { isPaid } from "@/lib/access";

export const maxDuration = 60;
const schema = z.object({ action: z.enum(["simulate", "seed", "toggle-plus"]), reason: z.string().max(300).optional() });

// Demo tools so anyone can see the comeback and the plateau check without waiting days or weeks.
export const POST = handle(async (req) => {
  if (!demoToolsEnabled()) return json({ error: "Demo tools are switched off." }, 403);
  const user = await apiUser();
  const d = await body<z.infer<typeof schema>>(req, schema);
  if (d.action === "toggle-plus") {
    const plan = isPaid(user.plan) ? "free" : "plus";
    await q(`update users set plan = $2 where id = $1`, [user.id, plan]);
    return json({ plan });
  }
  if (d.action === "seed") {
    try { return json({ sessions: await seedHistory(user.id) }); }
    catch { return json({ error: "Finish the quick setup first." }, 400); }
  }
  await shiftHistory(user.id, 3);
  const id = await generateComeback(user.id, { reason: d.reason, force: true });
  return id ? json({ ok: true }) : json({ error: "No comeback was needed or you haven't set up a plan yet." }, 400);
});
