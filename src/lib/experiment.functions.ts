import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const experience = z.enum(["redness", "botox_information", "skin_journey"]);
const refCode = z.string().regex(/^[A-Za-z0-9]{6,16}$/);

export const EVENTS = [
  "analysis_started",
  "analysis_completed",
  "email_gate_viewed",
  "email_submitted",
  "results_viewed",
  "skin_journey_cta_viewed",
  "skin_journey_started",
  "skin_journey_photo_mode_selected",
  "skin_journey_private_mode_selected",
  "skin_journey_generated",
  "share_card_created",
  "share_clicked",
  "skin_journey_shared",
  "skin_journey_saved",
  "referral_link_created",
  "referral_visit",
  "referral_link_clicked",
  "referral_signup",
  "referred_user_signed_up",
  "referral_first_checkin",
  "referred_user_completed_first_checkin",
] as const;

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        event: z.enum(EVENTS),
        experience,
        sessionId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
        referralCode: refCode.optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("experiment_events").insert({
      event_name: data.event,
      experience_type: data.experience,
      session_id: data.sessionId,
      referral_code: data.referralCode ?? null,
    } as never);
    if (error) console.error("trackEvent failed", error.message);
    return { ok: !error };
  });

export const submitEmail = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(255),
        experience: z.enum(["redness", "botox_information"]),
        referredBy: refCode.optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("email_leads").insert({
      email: data.email,
      experience_type: data.experience,
      referred_by: data.referredBy ?? null,
    } as never);
    if (error) {
      console.error("submitEmail failed", error.message);
      return { ok: false };
    }
    return { ok: true };
  });
