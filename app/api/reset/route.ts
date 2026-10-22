import { writeUser } from "@/lib/db";

export async function POST() {
  writeUser(null);
  return Response.json({ status: "none" });
}
