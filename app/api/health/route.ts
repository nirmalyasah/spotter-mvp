import { q } from "@/lib/db";
import { aiConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

// A quick "is everything switched on?" check. It only reports yes/no, never any secrets.
export async function GET() {
  let db = false;
  try { await q("select 1"); db = true; } catch {}
  return Response.json({ ok: db, db, ai: aiConfigured(), cron: !!process.env.CRON_SECRET });
}
