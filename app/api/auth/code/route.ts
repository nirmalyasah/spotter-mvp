import { q } from "@/lib/db";
import { apiUser, handle, json } from "@/lib/api";
import { hashCode, newAccessCode } from "@/lib/auth";

// Make a fresh access code. The old one stops working straight away.
export const POST = handle(async () => {
  const user = await apiUser();
  const code = newAccessCode();
  await q(`update users set access_code_hash = $2 where id = $1`, [user.id, hashCode(code)]);
  return json({ code });
});
