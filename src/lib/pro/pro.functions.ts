import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "../stripe.server";
import { priceInfo } from "./pricing";

type Env = { environment: StripeEnv };
const envOnly = <T extends Env>(d: T) => {
  if (d.environment !== "sandbox" && d.environment !== "live") throw new Error("Invalid environment");
  return d;
};
const okUrl = (u: unknown) => typeof u === "string" && /^https?:\/\//.test(u);

async function resolveCustomer(stripe: ReturnType<typeof createStripeClient>, userId: string, email?: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) throw new Error("Invalid userId");
  const found = await stripe.customers.search({ query: `metadata['userId']:'${userId}'`, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  if (email) {
    const existing = await stripe.customers.list({ email, limit: 1 });
    const c = existing.data[0];
    if (c) {
      if (c.metadata?.["userId"] !== userId) await stripe.customers.update(c.id, { metadata: { ...c.metadata, userId } });
      return c.id;
    }
  }
  const created = await stripe.customers.create({ ...(email && { email }), metadata: { userId } });
  return created.id;
}

/** Promo code shown in the "Do you have a promo code?" field at checkout. */
const PROMO = { code: "ROSEA", couponId: "rosea_promo_100_once", percentOff: 100, duration: "once" as const };

/** Idempotently makes sure the ROSEA coupon + promotion code exist in this Stripe environment. */
async function ensurePromoCode(stripe: ReturnType<typeof createStripeClient>) {
  try {
    const existing = await stripe.promotionCodes.list({ code: PROMO.code, active: true, limit: 1 });
    if (existing.data[0]) return;
    try { await stripe.coupons.retrieve(PROMO.couponId); }
    catch { await stripe.coupons.create({ id: PROMO.couponId, percent_off: PROMO.percentOff, duration: PROMO.duration, name: PROMO.code }); }
    await stripe.promotionCodes.create({ code: PROMO.code, promotion: { type: "coupon", coupon: PROMO.couponId } });
  } catch (e) {
    console.error("ensurePromoCode failed", e);
  }
}

/** Starts an embedded subscription checkout for one of the four Pro prices. Charged immediately, no trial. */
export const createProCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Env & { priceId: string; returnUrl: string }) => {
    envOnly(d);
    if (!priceInfo(d.priceId)) throw new Error("Invalid price");
    if (!okUrl(d.returnUrl)) throw new Error("Invalid returnUrl");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string } | { alreadyPro: true }> => {
    try {
      const { data: active } = await context.supabase.rpc("has_active_pro", { _user_id: context.userId, _env: data.environment });
      if (active) return { alreadyPro: true };
      const info = priceInfo(data.priceId)!;
      const email = (context.claims as { email?: string }).email;
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const price = prices.data[0];
      if (!price) return { error: "Price not found" };
      await ensurePromoCode(stripe);
      const customer = await resolveCustomer(stripe, context.userId, email);
      const meta = { userId: context.userId, product: "rosea_pro", pricing_group: info.group };
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer,
        metadata: meta,
        subscription_data: { metadata: meta },
        managed_payments: { enabled: true },
        allow_promotion_codes: true,
      } as Parameters<typeof stripe.checkout.sessions.create>[0]);
      return { clientSecret: session.client_secret ?? "" };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

/** Verifies a returned checkout with Stripe, then records the subscription. Never trusts the browser. */
export const verifyProCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Env & { sessionId: string }) => {
    envOnly(d);
    if (!/^cs_[a-zA-Z0-9_]+$/.test(d.sessionId)) throw new Error("Invalid session");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ pro: boolean; priceId?: string; group?: string; cents?: number } | { error: string }> => {
    try {
      const stripe = createStripeClient(data.environment);
      const s = await stripe.checkout.sessions.retrieve(data.sessionId, { expand: ["subscription"] });
      const sub = s.subscription && typeof s.subscription !== "string" ? s.subscription : null;
      const paid = s.status === "complete" && s.payment_status === "paid" && s.metadata?.["product"] === "rosea_pro";
      if (s.metadata?.["userId"] !== context.userId || !paid || !sub) return { pro: false };
      const { upsertSubscription } = await import("./pro.server");
      await upsertSubscription(sub, data.environment, context.userId);
      const item = sub.items.data[0];
      const priceId = item?.price.lookup_key ?? "";
      return { pro: ["active", "trialing", "past_due"].includes(sub.status), priceId, group: priceInfo(priceId)?.group ?? "unknown", cents: s.amount_total ?? 0 };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

/** Opens Stripe's billing portal so customers can cancel or update their payment method. */
export const createProPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Env & { returnUrl: string }) => {
    envOnly(d);
    if (!okUrl(d.returnUrl)) throw new Error("Invalid returnUrl");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { data: sub } = await context.supabase.from("subscriptions").select("stripe_customer_id")
      .eq("user_id", context.userId).eq("environment", data.environment)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!sub?.stripe_customer_id) return { error: "No subscription found for this account." };
    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: data.returnUrl });
      return { url: portal.url };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });
