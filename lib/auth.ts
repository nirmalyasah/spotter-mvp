import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { q } from "./db.ts";

const COOKIE = "spotter_session";
const prod = process.env.NODE_ENV === "production";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    if (prod) throw new Error("SESSION_SECRET is not set");
    return new TextEncoder().encode("dev-only-secret-change-me-please-32chars");
  }
  return new TextEncoder().encode(s);
}

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const verifyPassword = (p: string, hash: string) => bcrypt.compare(p, hash);

export async function startSession(userId: string) {
  const token = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(userId)
    .setIssuedAt().setExpirationTime("30d").sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: prod, path: "/", maxAge: 30 * 86400 });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export type SessionUser = { id: string; email: string; name: string; plan: "free" | "pro" };

export async function currentUser(): Promise<SessionUser | null> {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    const rows = await q<SessionUser>(`select id, email, name, plan from users where id = $1`, [payload.sub]);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}
export const isPro = (u: { plan: string }) => u.plan === "pro";
