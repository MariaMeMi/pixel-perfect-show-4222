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
    const { SKIN_PHOTO_BUCKET } = await import("@/lib/skin-photos.server");
    const { data: photos } = await supabaseAdmin.from("skin_photos").select("id,path").eq("user_id", userId);
    if (photos?.length) {
      await supabaseAdmin.storage.from(SKIN_PHOTO_BUCKET).remove(photos.map((p) => p.path));
      await supabaseAdmin.from("skin_photos").delete().in("id", photos.map((p) => p.id));
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error("Could not delete account");
    return { ok: true };
  });
