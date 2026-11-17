import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

export type PlusState = {
  loading: boolean; signedIn: boolean;
  /** Paid access of any kind (legacy Plus or active Pro subscription). */
  isPlus: boolean;
  isPro: boolean; hasSubscription: boolean; cancelAtPeriodEnd: boolean;
  expiresAt: string | null; refresh: () => void;
};
const EMPTY = { loading: false, signedIn: false, isPlus: false, isPro: false, hasSubscription: false, cancelAtPeriodEnd: false, expiresAt: null as string | null };

/** Reads the signed-in user's own plan rows (RLS limits to their rows). UX only; server re-checks. */
export function usePlus(): PlusState {
  const [s, setS] = useState({ ...EMPTY, loading: true });
  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setS(EMPTY);
    let env: "sandbox" | "live" = "sandbox";
    try { env = getStripeEnvironment(); } catch { /* not configured */ }
    const [{ data: plan }, { data: sub }] = await Promise.all([
      supabase.from("user_plans").select("plan, plus_expires_at").eq("user_id", session.user.id).eq("environment", env).maybeSingle(),
      supabase.from("subscriptions").select("status, current_period_end, cancel_at_period_end")
        .eq("user_id", session.user.id).eq("environment", env).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const plusExp = plan?.plus_expires_at ?? null;
    const legacy = plan?.plan === "plus" && !!plusExp && new Date(plusExp) > new Date();
    const end = sub?.current_period_end ?? null;
    const isPro = !!sub && ["active", "trialing", "past_due"].includes(sub.status) && (!end || new Date(end) > new Date());
    setS({ loading: false, signedIn: true, isPlus: legacy || isPro, isPro, hasSubscription: !!sub,
      cancelAtPeriodEnd: !!sub?.cancel_at_period_end, expiresAt: isPro ? end : plusExp });
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { ...s, refresh: () => void load() };
}
