import { readUser, writeUser } from "@/lib/db";
import { buildView, byId, libraryIds, library } from "@/lib/view";
import { onlyKnownIds } from "@/lib/validatePlan";
import { hasOffLimitsTopic, mentionsRiskyTopic } from "@/lib/safety";
import { writeComeback } from "@/lib/ai";

export const maxDuration = 60;
const DAY = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const { reason = "", pretend = false } = await req.json().catch(() => ({}));
  const user = readUser();
  if (!user) return Response.json({ error: "Make a plan first." }, { status: 400 });

  // Demo button: move every date 3 days back so "3 days with no log" is true right now
  if (pretend) {
    user.createdAt -= 3 * DAY;
    user.logs = user.logs.map((l) => ({ ...l, at: l.at - 3 * DAY }));
  }

  // Plain-code rule: no log for 3 days?
  const lastActive = Math.max(user.createdAt, ...user.logs.map((l) => l.at));
  const daysMissed = Math.floor((Date.now() - lastActive) / DAY);
  if (daysMissed < 3) {
    writeUser(user);
    return Response.json({ error: "You're on track! No comeback needed yet." }, { status: 400 });
  }

  // Held for review: if their reason mentions off-limits topics, the AI never sees it
  const safeReason = mentionsRiskyTopic(String(reason)) ? "" : String(reason);

  let ids: string[] = [];
  let message = "Welcome back. No guilt. Here's a short, easy session to get you moving again.";
  let email = "Hi! We missed you. Here's a short, gentle session to ease back in. Open Spotter whenever you're ready.";
  let fallback = true;
  try {
    const ai = await writeComeback(user.summary, user.days[0], daysMissed, safeReason);
    ids = onlyKnownIds(ai.exerciseIds, libraryIds).slice(0, 2);
    if (ids.length >= 1 && !hasOffLimitsTopic(`${ai.message} ${ai.email}`)) {
      message = ai.message;
      email = ai.email;
      fallback = false;
    } else {
      ids = [];
    }
  } catch (e) {
    console.error("AI comeback failed:", (e as Error).message);
  }
  if (!ids.length) ids = library.slice(0, 2).map((e) => e.id);

  user.comeback = { ids, message, email, fallback, cursor: 0 };
  writeUser(user);
  return Response.json(buildView(user));
}
