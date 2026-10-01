import type Stripe from "stripe";
import type { StripeEnv } from "./stripe.server";

export const PLUS_PRICE_ID = "rosea_plus_year";

/** True only when Stripe says this session was fully paid for Rosea Plus. */
export function isPaidPlusSession(s: Stripe.Checkout.Session): boolean {
  return s.status === "complete" && s.payment_status === "paid" && s.metadata?.["product"] === "rosea_plus";
}

/** Grants Plus for 1 year from the purchase time. Idempotent per session. Server-only. */
export async function grantPlus(userId: string, s: Stripe.Checkout.Session, env: StripeEnv) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const started = new Date(s.created * 1000);
  const expires = new Date(started);
  expires.setFullYear(expires.getFullYear() + 1);
  const { data: existing } = await supabaseAdmin
    .from("user_plans").select("plus_expires_at").eq("user_id", userId).eq("environment", env).maybeSingle();
  // Never shorten an existing longer access period.
  if (existing?.plus_expires_at && new Date(existing.plus_expires_at) > expires) return existing.plus_expires_at;
  const { error } = await supabaseAdmin.from("user_plans").upsert({
    user_id: userId,
    environment: env,
    plan: "plus",
    plus_started_at: started.toISOString(),
    plus_expires_at: expires.toISOString(),
    stripe_session_id: s.id,
    stripe_customer_id: typeof s.customer === "string" ? s.customer : s.customer?.id ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,environment" });
  if (error) throw error;
  return expires.toISOString();
}
