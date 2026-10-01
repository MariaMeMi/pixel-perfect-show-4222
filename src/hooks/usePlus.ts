import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

export type PlusState = { loading: boolean; signedIn: boolean; isPlus: boolean; expiresAt: string | null; refresh: () => void };

/** Reads the signed-in user's own plan (RLS limits this to their row). UX only; server re-checks. */
export function usePlus(): PlusState {
  const [s, setS] = useState({ loading: true, signedIn: false, isPlus: false, expiresAt: null as string | null });
  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setS({ loading: false, signedIn: false, isPlus: false, expiresAt: null });
    let env: "sandbox" | "live" = "sandbox";
    try { env = getStripeEnvironment(); } catch { /* not configured */ }
    const { data } = await supabase.from("user_plans").select("plan, plus_expires_at")
      .eq("user_id", session.user.id).eq("environment", env).maybeSingle();
    const exp = data?.plus_expires_at ?? null;
    setS({ loading: false, signedIn: true, isPlus: data?.plan === "plus" && !!exp && new Date(exp) > new Date(), expiresAt: exp });
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { ...s, refresh: () => void load() };
}
