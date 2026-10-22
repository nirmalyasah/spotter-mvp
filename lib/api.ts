import { currentUser } from "./auth.ts";

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export async function apiUser() {
  const u = await currentUser();
  if (!u) throw json({ error: "Please log in." }, 401);
  return u;
}

// Wraps a route so thrown responses are returned and surprises become a friendly error.
export const handle = (fn: (req: Request) => Promise<Response>) => async (req: Request) => {
  try {
    return await fn(req);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
};

export function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

export async function body<T>(req: Request, schema: { safeParse: (v: unknown) => any }): Promise<T> {
  const raw = await req.json().catch(() => null);
  const r = schema.safeParse(raw);
  if (!r.success) throw json({ error: r.error?.issues?.[0]?.message ?? "That doesn't look right." }, 400);
  return r.data as T;
}
