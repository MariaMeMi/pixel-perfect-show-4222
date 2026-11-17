import type { Analysis } from "@/lib/types";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { stripeEnvForHost, userHasPaidAccess } from "./paid-access.server";

/** Releases a withheld full analysis only to a signed-in user with verified paid access. */
export const unlockAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { resultId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.resultId)) throw new Error("Invalid result");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ result: Analysis } | { error: string }> => {
    const env = stripeEnvForHost(new URL(getRequest().url).host);
    if (!(await userHasPaidAccess(context.userId, env))) return { error: "not_paid" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("locked_analyses").select("result").eq("id", data.resultId).maybeSingle();
    if (!row) return { error: "expired" };
    return { result: row.result as unknown as Analysis };
  });
