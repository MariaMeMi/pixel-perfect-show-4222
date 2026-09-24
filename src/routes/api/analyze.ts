import { createFileRoute } from "@tanstack/react-router";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["score", "irritation", "regions", "summary", "observations", "contributors", "tips"],
  properties: {
    score: { type: "integer", description: "Overall visible redness, 0 (none) to 100 (very strong)" },
    irritation: { type: "integer", description: "Visible irritation such as bumps or flaking, 0-100" },
    regions: {
      type: "object",
      additionalProperties: false,
      required: ["forehead", "nose", "leftCheek", "rightCheek", "chin"],
      properties: {
        forehead: { type: "integer" },
        nose: { type: "integer" },
        leftCheek: { type: "integer" },
        rightCheek: { type: "integer" },
        chin: { type: "integer" },
      },
    },
    summary: { type: "string", description: "One calm sentence describing what is visible." },
    observations: { type: "array", items: { type: "string" }, description: "2-4 short visual observations" },
    contributors: {
      type: "array",
      items: { type: "string" },
      description: "2-4 common lifestyle factors, phrased as possibilities, never as causes",
    },
    tips: { type: "array", items: { type: "string" }, description: "4-5 low-risk gentle skincare suggestions" },
  },
} as const;

const SYSTEM = `You are Rose AI, a calm skin-tracking assistant for people with facial redness.
You describe only what is visually observable in a photo. You never diagnose rosacea or any
medical condition, never name medications, and never claim a factor caused the redness.
Language is warm, simple and reassuring. Suggestions stay low-risk and general (gentle cleanser,
moisturiser, broad-spectrum sunscreen, simplify the routine, avoid known personal triggers).
Scores: 0-24 calm, 25-44 mild, 45-69 moderate, 70-100 high visible redness.
If the image shows no clear face, return score 0 and explain that in the summary.`;

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json({ error: "AI is not configured." }, { status: 500 });
        }

        let image: string | undefined;
        let lang = "en";
        try {
          const body = (await request.json()) as { image?: string; lang?: string };
          image = body.image;
          lang = body.lang === "de" ? "de" : "en";
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }
        if (!image || !image.startsWith("data:image/")) {
          return Response.json({ error: "A photo is required." }, { status: 400 });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "openai/gpt-6-astra",
            stream: true,
            instructions: SYSTEM,
            reasoning: { effort: "low" },
            input: [
              {
                role: "user",
                content: [
                  {
                    type: "input_text",
                    text:
                      lang === "de"
                        ? "Beschreibe die sichtbare Gesichtsrötung auf diesem Foto und fülle das Schema aus. Antworte auf Deutsch."
                        : "Describe the visible facial redness in this photo and fill in the schema. Answer in English.",
                  },
                  { type: "input_image", image_url: image },
                ],
              },
            ],
            text: {
              format: {
                type: "json_schema",
                name: "redness_analysis",
                strict: true,
                schema: SCHEMA,
              },
            },
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          const status = upstream.status === 429 || upstream.status === 402 ? upstream.status : 502;
          return Response.json(
            {
              error:
                upstream.status === 402
                  ? "AI credits are used up. Add credits to keep analyzing photos."
                  : upstream.status === 429
                    ? "Too many requests right now. Please try again in a moment."
                    : "The analysis service is unavailable right now.",
              detail: detail.slice(0, 400),
            },
            { status },
          );
        }

        // Consume the SSE stream server-side; only the final JSON matters here.
        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let text = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            for (const line of frame.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const event = JSON.parse(payload) as {
                  type?: string;
                  delta?: string;
                  response?: { output_text?: string };
                };
                if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
                  text += event.delta;
                } else if (event.type === "response.completed" && event.response?.output_text) {
                  text = event.response.output_text;
                }
              } catch {
                /* ignore partial frames */
              }
            }
          }
        }

        try {
          const parsed = JSON.parse(text);
          return Response.json(parsed);
        } catch {
          return Response.json({ error: "The analysis came back unreadable." }, { status: 502 });
        }
      },
    },
  },
});
