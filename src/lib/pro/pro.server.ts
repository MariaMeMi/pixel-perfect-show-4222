import type Stripe from "stripe";
import type { StripeEnv } from "../stripe.server";
import { priceInfo } from "./pricing";

const groupOf = (priceId: string | null | undefined) => priceInfo(priceId ?? "")?.group ?? "unknown";
const iso = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);

/** Mirrors a Stripe subscription into our table. Server-only; caller must have verified it with Stripe. */
export async function upsertSubscription(sub: Stripe.Subscription, env: StripeEnv, fallbackUserId?: string) {
  const userId = sub.metadata?.["userId"] || fallbackUserId;
  if (!userId) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const item = sub.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.["lovable_external_id"] || item?.price?.id || "";
  const s = sub as Stripe.Subscription & { current_period_start?: number; current_period_end?: number };
  const { error } = await supabaseAdmin.from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: sub.id,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    price_id: priceId,
    pricing_group: groupOf(priceId),
    status: sub.status,
    current_period_start: iso(item?.current_period_start ?? s.current_period_start),
    current_period_end: iso(item?.current_period_end ?? s.current_period_end),
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    canceled_at: iso(sub.canceled_at),
    environment: env,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" });
  if (error) throw error;
}

async function subscriptionRow(subId: string | null | undefined) {
  if (!subId) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("subscriptions").select("user_id, price_id, pricing_group").eq("stripe_subscription_id", subId).maybeSingle();
  return data;
}

/** Records a paid invoice once (idempotent on invoice id). */
export async function recordPayment(inv: Stripe.Invoice, env: StripeEnv) {
  if (!inv.id || !inv.amount_paid) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const line = inv.lines?.data?.[0] as (Stripe.InvoiceLineItem & { price?: Stripe.Price; pricing?: { price_details?: { price?: string } } }) | undefined;
  const parent = (inv as Stripe.Invoice & { parent?: { subscription_details?: { subscription?: string | Stripe.Subscription; metadata?: Record<string, string> } } }).parent;
  const subRef = parent?.subscription_details?.subscription;
  const subId = typeof subRef === "string" ? subRef : subRef?.id;
  const row = await subscriptionRow(subId);
  const priceId = row?.price_id ?? line?.price?.lookup_key ?? null;
  await supabaseAdmin.from("payment_events").upsert({
    stripe_object_id: inv.id,
    kind: "payment",
    user_id: row?.user_id ?? parent?.subscription_details?.metadata?.["userId"] ?? null,
    stripe_subscription_id: subId ?? null,
    price_id: priceId,
    pricing_group: row?.pricing_group ?? groupOf(priceId),
    amount_cents: inv.amount_paid,
    currency: inv.currency,
    environment: env,
  }, { onConflict: "stripe_object_id", ignoreDuplicates: true });
}

/** Records refunds on a charge, linked back to the paid invoice's price group. */
export async function recordRefund(charge: Stripe.Charge, env: StripeEnv) {
  if (!charge.amount_refunded) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const invRef = (charge as Stripe.Charge & { invoice?: string | { id: string } | null }).invoice;
  const invId = typeof invRef === "string" ? invRef : invRef?.id;
  let paid: { user_id: string | null; price_id: string | null; pricing_group: string; stripe_subscription_id: string | null } | null = null;
  if (invId) {
    const { data } = await supabaseAdmin.from("payment_events").select("user_id, price_id, pricing_group, stripe_subscription_id").eq("stripe_object_id", invId).maybeSingle();
    paid = data;
  }
  await supabaseAdmin.from("payment_events").upsert({
    stripe_object_id: `${charge.id}:refund:${charge.amount_refunded}`,
    kind: "refund",
    user_id: paid?.user_id ?? null,
    stripe_subscription_id: paid?.stripe_subscription_id ?? null,
    price_id: paid?.price_id ?? null,
    pricing_group: paid?.pricing_group ?? "unknown",
    amount_cents: charge.amount_refunded,
    currency: charge.currency,
    environment: env,
  }, { onConflict: "stripe_object_id", ignoreDuplicates: true });
}
