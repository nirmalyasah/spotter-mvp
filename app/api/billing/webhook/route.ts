import { q } from "@/lib/db";
import { verifyStripeSignature } from "@/lib/billing";

// Stripe tells us when someone pays or cancels. We only trust it after checking its signature.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();
  if (!secret || !verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) return new Response("bad signature", { status: 400 });
  const event = JSON.parse(raw);
  const obj = event.data?.object ?? {};
  try {
    if (event.type === "checkout.session.completed" && obj.client_reference_id) {
      await q(`update users set plan = 'pro', stripe_customer_id = $2, stripe_subscription_id = $3 where id = $1`,
        [obj.client_reference_id, obj.customer ?? null, obj.subscription ?? null]);
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const active = event.type === "customer.subscription.updated" && ["active", "trialing"].includes(obj.status);
      await q(`update users set plan = $2 where stripe_subscription_id = $1`, [obj.id, active ? "pro" : "free"]);
    }
  } catch (e) {
    console.error("webhook failed:", (e as Error).message);
    return new Response("error", { status: 500 });
  }
  return new Response("ok");
}
