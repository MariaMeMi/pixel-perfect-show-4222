import { createFileRoute } from "@tanstack/react-router";
import { MAX_PHOTOS_PER_DEVICE_PER_DAY, SKIN_PHOTO_BUCKET, deviceHash, validDeviceKey } from "@/lib/skin-photos.server";

async function caller(request: Request) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const auth = request.headers.get("Authorization");
  let userId: string | null = null;
  if (auth?.startsWith("Bearer ")) {
    const { data } = await supabaseAdmin.auth.getUser(auth.slice(7));
    userId = data.user?.id ?? null;
  }
  return { admin: supabaseAdmin, userId };
}

export const Route = createFileRoute("/api/skin-photo")({
  server: {
    handlers: {
      // Stores a photo only when the person ticked the consent box.
      POST: async ({ request }) => {
        let body: { image?: unknown; deviceKey?: unknown; consent?: unknown; score?: unknown; summary?: unknown; lang?: unknown };
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
        if (body.consent !== true) return Response.json({ error: "Consent required." }, { status: 400 });
        if (!validDeviceKey(body.deviceKey)) return Response.json({ error: "Invalid request." }, { status: 400 });
        const m = typeof body.image === "string" ? /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(body.image) : null;
        const kind = m?.[1]; const b64 = m?.[2];
        if (!kind || !b64 || b64.length > 3_000_000) return Response.json({ error: "Invalid photo." }, { status: 400 });
        const { admin, userId } = await caller(request);
        const hash = await deviceHash(body.deviceKey);
        const since = new Date(Date.now() - 86_400_000).toISOString();
        const { count } = await admin.from("skin_photos").select("id", { count: "exact", head: true }).eq("device_hash", hash).gte("created_at", since);
        if ((count ?? 0) >= MAX_PHOTOS_PER_DEVICE_PER_DAY) return Response.json({ error: "Limit reached." }, { status: 429 });
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const ext = kind === "jpeg" ? "jpg" : kind;
        const path = `${userId ?? "guest"}/${crypto.randomUUID()}.${ext}`;
        const up = await admin.storage.from(SKIN_PHOTO_BUCKET).upload(path, bytes, { contentType: `image/${kind}` });
        if (up.error) return Response.json({ error: "Could not save." }, { status: 500 });
        const score = typeof body.score === "number" ? Math.max(0, Math.min(100, Math.round(body.score))) : null;
        const summary = typeof body.summary === "string" ? body.summary.slice(0, 500) : null;
        const lang = body.lang === "de" || body.lang === "ru" ? body.lang : "en";
        const { error } = await admin.from("skin_photos").insert({ user_id: userId, device_hash: hash, path, score, summary, lang });
        if (error) { await admin.storage.from(SKIN_PHOTO_BUCKET).remove([path]); return Response.json({ error: "Could not save." }, { status: 500 }); }
        return Response.json({ ok: true });
      },
      // Deletes every stored photo for this device, plus the signed-in account's photos.
      DELETE: async ({ request }) => {
        let body: { deviceKey?: unknown };
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
        const { admin, userId } = await caller(request);
        const filters: string[] = [];
        if (validDeviceKey(body.deviceKey)) filters.push(`device_hash.eq.${await deviceHash(body.deviceKey)}`);
        if (userId) filters.push(`user_id.eq.${userId}`);
        if (!filters.length) return Response.json({ ok: true, deleted: 0 });
        const { data } = await admin.from("skin_photos").select("id,path").or(filters.join(","));
        const rows = data ?? [];
        if (rows.length) {
          await admin.storage.from(SKIN_PHOTO_BUCKET).remove(rows.map((r) => r.path));
          await admin.from("skin_photos").delete().in("id", rows.map((r) => r.id));
        }
        return Response.json({ ok: true, deleted: rows.length });
      },
    },
  },
});
