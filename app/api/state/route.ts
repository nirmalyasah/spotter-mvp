import { readUser } from "@/lib/db";
import { buildView } from "@/lib/view";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildView(await readUser()));
}
