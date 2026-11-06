// Per-user caps on paid AI calls. Signed-in callers are keyed by user id; guests by a hashed IP.
export const AI_LIMITS = {
  rosacea: [{ max: 3, seconds: 86_400 }, { max: 40, seconds: 2_592_000 }],
  botox: [{ max: 3, seconds: 86_400 }, { max: 40, seconds: 2_592_000 }],
  rosie: [{ max: 30, seconds: 86_400 }, { max: 300, seconds: 2_592_000 }],
} as const;

export type AiFeature = keyof typeof AI_LIMITS;

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function callerKey(request: Request) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    const { data } = await supabaseAdmin.auth.getUser(auth.slice(7));
    if (data.user) return { admin: supabaseAdmin, key: `u:${data.user.id}` };
  }
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return { admin: supabaseAdmin, key: `ip:${(await sha256(`rose-ai:${ip}`)).slice(0, 32)}` };
}

/** Returns a 429 Response when the caller is over a limit, otherwise null. Fails closed. */
export async function enforceAiLimit(request: Request, feature: AiFeature): Promise<Response | null> {
  try {
    const { admin, key } = await callerKey(request);
    for (const w of AI_LIMITS[feature]) {
      const { data, error } = await admin.rpc("forum_consume_limit", {
        k: `ai:${feature}:${w.seconds}:${key}`,
        max_requests: w.max,
        seconds: w.seconds,
      });
      if (error) throw error;
      if (data === false) {
        const daily = w.seconds === 86_400;
        const message = daily
          ? "You've reached today's limit. Please try again tomorrow."
          : "You've reached this month's limit. Please try again later.";
        return Response.json({ error: message, message }, { status: 429 });
      }
    }
    return null;
  } catch {
    const message = "This feature is temporarily unavailable. Please try again soon.";
    return Response.json({ error: message, message }, { status: 503 });
  }
}
