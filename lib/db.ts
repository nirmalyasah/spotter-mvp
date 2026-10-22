import { cookies } from "next/headers";

// Each visitor's plan and logs live in their own browser cookie. This works on Vercel (no disk
// needed) and keeps visitors separate. A real launch would use a database instead.
const NAME = "spotter_user";

export type Log = { exerciseId: string; kg: number; hit: boolean; at: number };

export type Comeback = {
  ids: string[];
  message: string;
  email: string;
  fallback: boolean;
  cursor: number;
};

export type User = {
  summary: string;
  welcome: string;
  fallback: boolean;
  days: string[][];
  weights: Record<string, number>;
  cursor: number;
  createdAt: number;
  logs: Log[];
  comeback: Comeback | null;
};

const encode = (u: User) => Buffer.from(JSON.stringify(u)).toString("base64url");

export async function readUser(): Promise<User | null> {
  try {
    const raw = (await cookies()).get(NAME)?.value;
    return raw ? JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) : null;
  } catch {
    return null;
  }
}

export async function writeUser(user: User | null) {
  const store = await cookies();
  if (!user) {
    store.delete(NAME);
    return;
  }
  // Cookies are limited to ~4 KB, so keep only the most recent logs.
  user.logs = user.logs.slice(-6);
  let value = encode(user);
  if (value.length > 3800) {
    user.logs = user.logs.slice(-2);
    value = encode(user);
  }
  store.set(NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}
