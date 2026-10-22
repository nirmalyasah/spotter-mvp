import { readUser, writeUser } from "@/lib/db";
import { buildView, byId } from "@/lib/view";
import { nextWeight } from "@/lib/progression";

export async function POST(req: Request) {
  const { hit } = await req.json().catch(() => ({}));
  const user = await readUser();
  if (!user) return Response.json({ error: "No plan yet." }, { status: 400 });

  const ids = user.comeback ? user.comeback.ids : user.days[0];
  const cursor = user.comeback ? user.comeback.cursor : user.cursor;
  const ex = byId(ids[cursor]);
  if (!ex) return Response.json(buildView(user));

  const kg = user.weights[ex.id] ?? ex.startKg;
  user.logs.push({ exerciseId: ex.id, kg, hit: !!hit, at: Date.now() });

  if (user.comeback) {
    user.comeback.cursor += 1; // comeback sessions don't change your weights
    if (user.comeback.cursor >= user.comeback.ids.length) user.comeback = null;
  } else {
    user.weights[ex.id] = nextWeight(kg, !!hit, ex.maxKg); // plain-code progression rule
    user.cursor += 1;
  }
  await writeUser(user);
  return Response.json(buildView(user));
}
