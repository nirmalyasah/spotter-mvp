import { writeUser, type User } from "@/lib/db";
import { buildView, library, libraryIds } from "@/lib/view";
import { checkSafety, hasOffLimitsTopic, validateAnswer, type AnswerKey } from "@/lib/safety";
import { validPlanDays } from "@/lib/validatePlan";
import { buildPlan } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { answers, forceStandard } = await req.json().catch(() => ({}));
  if (!answers) return Response.json({ error: "No answers were sent." }, { status: 400 });

  // 1. Plain-code checks on every answer
  for (const key of ["goal", "days", "age", "gym", "nervous"] as AnswerKey[]) {
    const problem = validateAnswer(key, String(answers[key] ?? ""));
    if (problem) return Response.json({ error: problem }, { status: 400 });
  }

  // 2. Safety rules run BEFORE any AI
  const safety = checkSafety(Number(answers.age), [answers.goal, answers.gym, answers.nervous]);
  if (!safety.ok) return Response.json({ status: "blocked", message: safety.message });

  // 3. Ask Claude (or use the standard plan), then check what it says
  let days: string[][] | null = null;
  let summary = "You're new to the gym and want a clear plan to follow.";
  let welcome = "Let's start easy. You've got this.";
  let fallback = true;
  if (!forceStandard) {
    try {
      const ai = await buildPlan(answers);
      days = validPlanDays(ai.days, libraryIds);
      if (days && !hasOffLimitsTopic(`${ai.summary} ${ai.welcome}`)) {
        summary = ai.summary;
        welcome = ai.welcome;
        fallback = false;
      } else {
        days = null;
      }
    } catch (e) {
      console.error("AI plan failed:", (e as Error).message);
    }
  }
  if (!days) {
    const ids = library.map((e) => e.id);
    days = [ids.slice(0, 3), ids.slice(2, 5), ids.slice(4, 7)];
  }

  // 4. Save
  const weights: Record<string, number> = {};
  for (const e of library) weights[e.id] = e.startKg;
  const user: User = {
    summary, welcome, fallback, days, weights,
    cursor: 0, createdAt: Date.now(), logs: [], comeback: null,
  };
  await writeUser(user);
  return Response.json(buildView(user));
}
