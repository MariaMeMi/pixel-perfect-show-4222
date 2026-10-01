import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "./stripe.server";
import { PLUS_PRICE_ID, grantPlus, isPaidPlusSession } from "./plus.server";

type Env = { environment: StripeEnv };
const envOnly = (d: Env) => {
  if (d.environment !== "sandbox" && d.environment !== "live") throw new Error("Invalid environment");
  return d;
};

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

export const createPlusCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Env & { returnUrl: string }) => {
    envOnly(d);
    if (typeof d.returnUrl !== "string" || !/^https?:\/\//.test(d.returnUrl)) throw new Error("Invalid returnUrl");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    try {
      const email = (context.claims as { email?: string }).email;
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [PLUS_PRICE_ID] });
      const price = prices.data[0];
      if (!price) return { error: "Price not found" };
      const productId = typeof price.product === "string" ? price.product : price.product.id;
      const product = await stripe.products.retrieve(productId);
      const customer = await resolveCustomer(stripe, context.userId, email);
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer,
        payment_intent_data: { description: product.name },
        metadata: { userId: context.userId, product: "rosea_plus" },
        managed_payments: { enabled: true },
      } as Parameters<typeof stripe.checkout.sessions.create>[0]);
      return { clientSecret: session.client_secret ?? "" };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

/** Server-side verification of a returned checkout session. Never trusts the browser. */
export const verifyPlusCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Env & { sessionId: string }) => {
    envOnly(d);
    if (!/^cs_[a-zA-Z0-9_]+$/.test(d.sessionId)) throw new Error("Invalid session");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ plus: boolean; expiresAt?: string } | { error: string }> => {
    try {
      const stripe = createStripeClient(data.environment);
      const s = await stripe.checkout.sessions.retrieve(data.sessionId);
      if (s.metadata?.["userId"] !== context.userId || !isPaidPlusSession(s)) return { plus: false };
      return { plus: true, expiresAt: await grantPlus(context.userId, s, data.environment) };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

/** Looks up past paid Plus purchases for this account in Stripe and re-applies the latest. */
export const restorePlusAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(envOnly)
  .handler(async ({ data, context }): Promise<{ plus: boolean; expiresAt?: string } | { error: string }> => {
    try {
      if (!/^[a-zA-Z0-9_-]+$/.test(context.userId)) throw new Error("Invalid userId");
      const stripe = createStripeClient(data.environment);
      const customers = await stripe.customers.search({ query: `metadata['userId']:'${context.userId}'`, limit: 10 });
      let latest: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>> | undefined;
      for (const c of customers.data) {
        const sessions = await stripe.checkout.sessions.list({ customer: c.id, limit: 100 });
        for (const s of sessions.data) {
          if (isPaidPlusSession(s) && (!latest || s.created > latest.created)) latest = s;
        }
      }
      if (!latest) return { plus: false };
      const expiresAt = await grantPlus(context.userId, latest, data.environment);
      return { plus: new Date(expiresAt) > new Date(), expiresAt };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });
