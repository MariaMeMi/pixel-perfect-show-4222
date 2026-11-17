import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminSkinPhoto = { id: string; url: string; score: number | null; summary: string | null; lang: string; createdAt: string; signedIn: boolean };

/** Lists consented skin-check photos for owner review. Server-side admin check by verified user id. */
export const listSkinPhotos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ allowed: boolean; photos: AdminSkinPhoto[] }> => {
    const { PHOTO_ADMIN_IDS, SKIN_PHOTO_BUCKET } = await import("@/lib/skin-photos.server");
    if (!PHOTO_ADMIN_IDS.has(context.userId)) return { allowed: false, photos: [] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("skin_photos").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error("Could not load photos");
    const rows = data ?? [];
    if (!rows.length) return { allowed: true, photos: [] };
    const { data: signed } = await supabaseAdmin.storage.from(SKIN_PHOTO_BUCKET).createSignedUrls(rows.map((r) => r.path), 600);
    const urls = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
    return {
      allowed: true,
      photos: rows.map((r) => ({ id: r.id, url: urls.get(r.path) ?? "", score: r.score, summary: r.summary, lang: r.lang, createdAt: r.created_at, signedIn: !!r.user_id })),
    };
  });
