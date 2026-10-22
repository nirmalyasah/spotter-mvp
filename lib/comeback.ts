import { q } from "./db.ts";
import { APP } from "./config.ts";
import { byId } from "./exercises.ts";
import { writeComeback } from "./ai.ts";
import { onlyKnownIds, fallbackDays } from "./plan.ts";
import { hasOffLimitsTopic, mentionsRiskyTopic } from "./safety.ts";
import { sendEmail } from "./email.ts";
import { getPlan, getProfile, lastActivityMs, pendingComeback, recordAiUse } from "./queries.ts";
import { daysSince } from "./stats.ts";

const DEFAULT_MESSAGE = "Welcome back. No guilt. Here's a short, easy session to get you moving again.";
const DEFAULT_EMAIL = "Hi! We missed you. Here's a short, gentle session to ease back in. Open Spotter whenever you're ready.";

// Rule: no activity for 3+ days. AI writes the message; code checks every exercise it picks.
export async function generateComeback(uid: string, opts: { reason?: string; force?: boolean } = {}) {
  const profile = await getProfile(uid);
  const plan = await getPlan(uid);
  if (!profile || !plan || profile.flagged) return null;
  if (await pendingComeback(uid)) return null;
  const missed = daysSince(await lastActivityMs(uid), Date.now());
  if (missed < APP.comebackAfterDays && !opts.force) return null;

  const usual = plan.days[0].map((id) => byId(id)?.name ?? id);
  const reason = opts.reason && !mentionsRiskyTopic(opts.reason) ? opts.reason : ""; // risky text never reaches the AI
  let ids: string[] = [], message = DEFAULT_MESSAGE, email = DEFAULT_EMAIL, ai = false;
  try {
    const out = await writeComeback(profile, usual, profile.available_ids, missed, reason);
    ids = onlyKnownIds(out.exerciseIds, profile.available_ids).slice(0, 2);
    if (ids.length && !hasOffLimitsTopic(`${out.message} ${out.email}`)) { message = out.message; email = out.email; ai = true; } else ids = [];
    await recordAiUse(uid, "comeback");
  } catch (e) {
    console.error("AI comeback failed:", (e as Error).message);
  }
  if (!ids.length) ids = (fallbackDays(profile.available_ids) ?? plan.days)[0].slice(0, 2);

  const row = (await q<{ id: string }>(
    `insert into comebacks (user_id, message, email_text, items, days_missed, ai) values ($1,$2,$3,$4::text::jsonb,$5,$6) returning id`,
    [uid, message, email, JSON.stringify(ids), missed, ai]))[0];

  const user = (await q<{ email: string; name: string }>(`select email, name from users where id = $1`, [uid]))[0];
  if (await sendEmail(user.email, "Your Spotter comeback session", `Hi ${user.name.split(" ")[0]},\n\n${email}\n\nOpen Spotter to start: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/app\n\n— Spotter`)) {
    await q(`update comebacks set emailed = true where id = $1`, [row.id]);
  }
  return row.id;
}
