import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { q } from "./db.ts";

// No email, no password: an account is just a name. A signed cookie keeps you logged in, and a short
// access code lets you get back in from another phone or browser.
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

// 10 characters from an alphabet without look-alikes (no 0/O, 1/I): about 50 bits of randomness.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newAccessCode(): string {
  const bytes = randomBytes(10);
  const raw = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}
export const normalizeCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");
export const hashCode = (c: string) => createHash("sha256").update(normalizeCode(c)).digest("hex");
export const hashIp = (ip: string) => createHash("sha256").update(`${ip}|${process.env.SESSION_SECRET ?? "dev"}`).digest("hex");

export async function startSession(userId: string) {
  const token = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(userId)
    .setIssuedAt().setExpirationTime("365d").sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: prod, path: "/", maxAge: 365 * 86400 });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export type SessionUser = { id: string; name: string };

export async function currentUser(): Promise<SessionUser | null> {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    const rows = await q<SessionUser>(`select id, name from users where id = $1`, [payload.sub]);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const u = await currentUser();
  if (!u) redirect("/");
  return u;
}
