import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createAiRunIdFetch } from "@/lib/ai-run-id.server";

const SYSTEM = `You are Rosie, the warm rose-blossom guide inside Rose AI, a wellness companion for recurring facial redness and skin tracking.

Voice: reassuring, concise, friendly, and practical. Use short paragraphs and occasional gentle rose imagery, never baby talk. Answer in the user's language when clear. Help with onboarding, photo preparation, understanding Rose AI screens, building consistent check-in habits, general skincare education, and preparing questions for a qualified professional.

Safety boundaries:
- You do not diagnose rosacea or any condition and never imply a photo confirms a diagnosis.
- You do not replace a dermatologist or qualified medical professional.
- For concerning, severe, sudden, painful, eye-related, infected, or rapidly worsening symptoms, encourage timely qualified medical care; for emergencies, advise urgent local help.
- Botox/facial-lines information is educational only. Never tell someone they need Botox, judge candidacy, give personalized or approximate doses/units, specify injection points, explain administration, or prescribe frequency. Encourage consultation with a properly qualified provider.
- Do not promise outcomes. Do not shame appearance.
- Do not ask for or repeat identifying information. Remind users not to share sensitive details in chat.
- Photos are private and are not shared without permission.

When asked about a visible result, explain what the app's wording means without inventing observations that are not in the conversation. Keep most answers under 180 words.`;

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Rosie couldn't reply just now.";
  if (/credit|payment|402/i.test(message)) return "Rosie is paused because AI credits are unavailable. Please try again after credits are added.";
  if (/rate|429/i.test(message)) return "Rosie is receiving many messages right now. Please wait a moment and try again.";
  return "Rosie couldn't reply just now. Your message is still here—please try again.";
}

export const Route = createFileRoute("/api/rosie-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = (await request.json()) as { messages?: UIMessage[] };
          if (!Array.isArray(payload.messages) || payload.messages.length > 100) {
            return Response.json({ message: "The conversation could not be read." }, { status: 400 });
          }
          const apiKey = process.env["LOVABLE_API_KEY"];
          if (!apiKey) return Response.json({ message: "Rosie is not configured yet." }, { status: 401 });

          const run = createAiRunIdFetch(request.headers.get("X-Lovable-AIG-Run-ID") ?? undefined);
          const openai = createOpenAI({
            baseURL: "https://ai.gateway.lovable.dev/v1",
            apiKey,
            headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
            fetch: run.fetch,
          });
          const result = streamText({
            model: openai.responses("openai/gpt-6-astra"),
            system: SYSTEM,
            messages: await convertToModelMessages(payload.messages),
            maxRetries: 0,
            providerOptions: {
              openai: {
                forceReasoning: true,
                reasoningEffort: "low",
                reasoningSummary: "auto",
                store: false,
                include: ["reasoning.encrypted_content"],
              },
            },
          });
          return result.toUIMessageStreamResponse({
            originalMessages: payload.messages,
            sendReasoning: false,
            onError: safeErrorMessage,
            headers: run.getRunId() ? { "X-Lovable-AIG-Run-ID": run.getRunId() ?? "" } : undefined,
          });
        } catch (error) {
          return Response.json({ message: safeErrorMessage(error) }, { status: 400 });
        }
      },
    },
  },
});