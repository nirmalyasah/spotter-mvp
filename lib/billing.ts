import { createHmac, timingSafeEqual } from "crypto";
import { APP, siteUrl } from "./config.ts";

// Payments use Stripe's REST API directly (no library). Switched on by STRIPE_SECRET_KEY.
export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

async function stripe(path: string, params: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Stripe error");
  return data;
}

export async function createCheckout(user: { id: string; email: string }, customerId?: string | null) {
  const params: Record<string, string> = {
    mode: "subscription",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "inr",
    "line_items[0][price_data][unit_amount]": String(APP.proPriceInr * 100),
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": "Spotter Pro",
    client_reference_id: user.id,
    success_url: `${siteUrl()}/app/settings?upgraded=1`,
    cancel_url: `${siteUrl()}/app/settings`,
  };
  if (customerId) params.customer = customerId;
  else params.customer_email = user.email;
  return (await stripe("checkout/sessions", params)).url as string;
}

export async function createPortal(customerId: string) {
  return (await stripe("billing_portal/sessions", { customer: customerId, return_url: `${siteUrl()}/app/settings` })).url as string;
}

// Checks that a webhook really came from Stripe (signature + 5 minute window).
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts.t, v1 = parts.v1;
  if (!t || !v1 || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
