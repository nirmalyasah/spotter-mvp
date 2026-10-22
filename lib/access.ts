import { q } from "./db.ts";
import { FREE } from "./config.ts";

// "plus" is the paid plan ("pro" is kept so earlier test accounts still count as paid).
export const isPaid = (plan?: string | null) => plan === "plus" || plan === "pro";

// What this person is allowed to do. Free = a one-time trial; Plus = everything.
export async function getAccess(uid: string, plan?: string | null) {
  const paid = isPaid(plan);
  const count = async (sql: string) => (await q<{ n: number }>(sql, [uid]))[0].n;
  const [workoutsDone, coachUsed, planBuilds] = await Promise.all([
    count(`select count(*)::int as n from sessions where user_id = $1 and completed_at is not null`),
    count(`select count(*)::int as n from ai_usage where user_id = $1 and kind = 'coach'`),
    count(`select count(*)::int as n from ai_usage where user_id = $1 and kind = 'plan'`),
  ]);
  return {
    paid, workoutsDone, coachUsed, planBuilds,
    workoutsLeft: paid ? null : Math.max(0, FREE.workouts - workoutsDone),
    coachLeft: paid ? null : Math.max(0, FREE.coachQuestions - coachUsed),
    buildsLeft: paid ? null : Math.max(0, FREE.planBuilds - planBuilds),
  };
}
export type Access = Awaited<ReturnType<typeof getAccess>>;

export const UPGRADE = { code: "upgrade" as const };
