import { apiUser, handle, json } from "@/lib/api";
import { getAccess } from "@/lib/access";

export const dynamic = "force-dynamic";

// Who am I, which plan am I on, and what's left of the free trial.
export const GET = handle(async () => {
  const user = await apiUser();
  return json({ id: user.id, name: user.name, plan: user.plan, access: await getAccess(user.id, user.plan) });
});
