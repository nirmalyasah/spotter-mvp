import { q } from "@/lib/db";
import { apiUser, handle, json } from "@/lib/api";
import { createPortal, stripeConfigured } from "@/lib/billing";

export const POST = handle(async () => {
  const user = await apiUser();
  const cust = (await q<{ stripe_customer_id: string | null }>(`select stripe_customer_id from users where id = $1`, [user.id]))[0];
  if (!stripeConfigured() || !cust?.stripe_customer_id) return json({ error: "No billing account found." }, 400);
  try {
    return json({ url: await createPortal(cust.stripe_customer_id) });
  } catch (e) {
    console.error("portal failed:", (e as Error).message);
    return json({ error: "We couldn't open billing. Please try again." }, 502);
  }
});
