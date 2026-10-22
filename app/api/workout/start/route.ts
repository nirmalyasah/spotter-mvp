import { apiUser, handle, json } from "@/lib/api";
import { startWorkout } from "@/lib/workout";
import { isPaid } from "@/lib/access";
import { FREE } from "@/lib/config";

export const POST = handle(async () => {
  const user = await apiUser();
  try {
    return json(await startWorkout(user.id, isPaid(user.plan)));
  } catch (e) {
    const m = (e as Error).message;
    if (m === "no_profile" || m === "no_plan") return json({ error: "Finish the quick setup first.", code: "onboarding" }, 400);
    if (m === "paywall") return json({ error: `You've used your ${FREE.workouts} free workouts. Spotter Plus keeps you going every day.`, code: "upgrade" }, 402);
    if (m === "flagged") return json({ error: "A trainer needs to check your details first, so workouts are paused.", code: "flagged" }, 403);
    throw e;
  }
});
