import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the caller's account and their server-side data. */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const {data:clinician,error:profileError}=await supabase.from('clinician_profiles').select('user_id').eq('user_id',userId).maybeSingle();
    if(profileError) throw new Error('Could not verify account deletion eligibility');
    if(clinician) throw new Error('Use Clinician Settings to request account and data deletion; records require retention review.');
    // Remove user-owned rows first (RLS scopes this to the caller).
    await supabase.from("rosie_conversations").delete().eq("user_id", userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error("Could not delete account");
    return { ok: true };
  });
