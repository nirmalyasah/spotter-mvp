import { q } from "@/lib/db";
import { apiUser, handle, json } from "@/lib/api";
import { createCheckout, stripeConfigured } from "@/lib/billing";

export const POST = handle(async () => {
  const user = await apiUser();
  if (!stripeConfigured()) return json({ error: "Payments aren't switched on yet. Spotter Pro is coming soon!", code: "payments_off" }, 501);
  if (user.plan === "pro") return json({ error: "You're already on Pro." }, 400);
  const cust = (await q<{ stripe_customer_id: string | null }>(`select stripe_customer_id from users where id = $1`, [user.id]))[0];
  try {
    return json({ url: await createCheckout(user, cust?.stripe_customer_id) });
  } catch (e) {
    console.error("checkout failed:", (e as Error).message);
    return json({ error: "We couldn't start the checkout. Please try again." }, 502);
  }
});
