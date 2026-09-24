import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const experience = z.enum(["redness", "botox_information"]);

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        event: z.enum([
          "analysis_started",
          "analysis_completed",
          "email_gate_viewed",
          "email_submitted",
          "results_viewed",
        ]),
        experience,
        sessionId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("experiment_events").insert({
      event_name: data.event,
      experience_type: data.experience,
      session_id: data.sessionId,
    });
    if (error) console.error("trackEvent failed", error.message);
    return { ok: !error };
  });

export const submitEmail = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(255),
        experience,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("email_leads")
      .insert({ email: data.email, experience_type: data.experience });
    if (error) {
      console.error("submitEmail failed", error.message);
      return { ok: false };
    }
    return { ok: true };
  });
