import { writeUser } from "@/lib/db";

export async function POST() {
  await writeUser(null);
  return Response.json({ status: "none" });
}
