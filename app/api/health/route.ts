import { q, databaseUrl } from "@/lib/db";
import { aiConfigured } from "@/lib/ai";
import { sessionSecretSource } from "@/lib/auth";

export const dynamic = "force-dynamic";

// A quick "is everything switched on?" check. It only reports yes/no and a short reason, never any secrets.
export async function GET() {
  let db = false, dbError: string | undefined;
  try { await q("select 1"); db = true; } catch (e) { dbError = String((e as Error).message ?? e).slice(0, 140); }
  return Response.json({
    ok: db && sessionSecretSource() !== "none", db, dbError,
    databaseAddressSet: !!databaseUrl(), sessionSecretSet: sessionSecretSource() !== "none", sessionSecretFrom: sessionSecretSource(),
    ai: aiConfigured(), cron: !!process.env.CRON_SECRET,
  });
}
