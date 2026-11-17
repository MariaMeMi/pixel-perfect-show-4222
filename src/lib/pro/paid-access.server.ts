import type { StripeEnv } from "../stripe.server";

/** Payment environment from the serving host, never from the browser: preview/dev hosts use test mode. */
export function stripeEnvForHost(host: string): StripeEnv {
  const h = host.toLowerCase().split(":")[0] ?? "";
  if (h === "localhost" || h === "127.0.0.1" || h.startsWith("id-preview--") || h.endsWith("-dev.lovable.app") || h.endsWith(".lovableproject.com")) return "sandbox";
  return "live";
}

/** True when the user has an active Pro subscription or unexpired legacy Plus. Server-only. */
export async function userHasPaidAccess(userId: string, env: StripeEnv): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: pro } = await supabaseAdmin.rpc("has_active_pro", { _user_id: userId, _env: env });
  if (pro) return true;
  const { data: plan } = await supabaseAdmin.from("user_plans").select("plan, plus_expires_at").eq("user_id", userId).eq("environment", env).maybeSingle();
  return plan?.plan === "plus" && !!plan.plus_expires_at && new Date(plan.plus_expires_at) > new Date();
}

/** Free preview fields only: score, summary, one observation. */
export function previewOf(full: Record<string, unknown>) {
  const obs = Array.isArray(full["observations"]) ? (full["observations"] as unknown[]).slice(0, 1) : [];
  return { score: full["score"], summary: full["summary"], irritation: full["irritation"], observations: obs, regions: Object.fromEntries(Object.keys((full["regions"] as Record<string, unknown>) ?? {}).map((k) => [k, 0])), contributors: [], tips: [], locked: true };
}
