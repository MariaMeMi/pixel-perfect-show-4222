import { createFileRoute } from "@tanstack/react-router";

const AREA = {
  type: "object",
  additionalProperties: false,
  required: ["level", "noticed"],
  properties: {
    level: { type: "string", enum: ["not_prominent", "visible_with_expression", "visible_at_rest"] },
    noticed: {
      type: "string",
      description: "1-2 neutral sentences describing only what is visible, comparing rest vs expression.",
    },
  },
} as const;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["forehead", "glabella", "eyes", "symmetry", "summary"],
  properties: {
    forehead: AREA,
    glabella: AREA,
    eyes: AREA,
    symmetry: { type: "string", description: "One neutral sentence about visible symmetry of expression." },
    summary: { type: "string", description: "One warm, non-judgmental overview sentence." },
  },
} as const;

const SYSTEM = `You are Rose AI's Botox AI, an educational assistant. You look at four selfies of the same person
(relaxed, raised eyebrows, smile, gentle frown) and describe ONLY objectively visible facial lines:
forehead lines, glabellar (between-the-eyebrows) lines, crow's-feet / eye-area lines, and symmetry of expression.
Strict rules: never diagnose; never say someone needs or is a good candidate for Botox or any treatment;
never mention doses, units, products, injection points or techniques; never promise outcomes or youthfulness;
never rate attractiveness, age or "imperfections". Tone: calm, respectful, neutral, informative — the person should
feel informed, not judged. Levels: "not_prominent" = barely visible even with expression;
"visible_with_expression" = mainly visible when the muscle moves; "visible_at_rest" = visible on the relaxed photo.
If faces are unclear, choose "not_prominent" and say the photo was unclear.`;

export const Route = createFileRoute("/api/botox")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "AI is not configured." }, { status: 500 });

        let images: string[] = [];
        let lang = "en";
        try {
          const body = (await request.json()) as { images?: string[]; lang?: string };
          images = Array.isArray(body.images) ? body.images : [];
          lang = body.lang === "de" ? "de" : "en";
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }
        if (![1, 4].includes(images.length) || images.some((i) => typeof i !== "string" || !i.startsWith("data:image/"))) {
          return Response.json({ error: "One baseline photo or four expression photos are required." }, { status: 400 });
        }
        const baselineOnly = images.length === 1;
        const labels = ["Relaxed", "Raised eyebrows", "Smile", "Gentle frown"];

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "openai/gpt-5-mini",
            stream: true,
            instructions: baselineOnly
              ? `${SYSTEM}\nFor this baseline, only ONE relaxed photo was provided. Describe visible lines at rest only. Never infer expression or symmetry of expression from this photo. Use visible_at_rest only when lines are clearly visible at rest; otherwise use not_prominent. State in the summary that expression cannot be assessed from one photo.`
              : SYSTEM,
            reasoning: { effort: "minimal" },
            input: [
              {
                role: "user",
                content: [
                  {
                    type: "input_text",
                      text: baselineOnly
                        ? lang === "de"
                          ? "Beschreibe nur die sichtbaren Linien im entspannten Gesicht auf diesem einzelnen Foto. Beurteile keinen Gesichtsausdruck. Antworte auf Deutsch."
                          : "Describe only visible facial lines at rest in this single relaxed photo. Do not assess expression. Answer in English."
                        : lang === "de"
                          ? "Beschreibe die sichtbaren Linien auf diesen vier Fotos (in der Reihenfolge: entspannt, Augenbrauen hoch, Lächeln, leichtes Stirnrunzeln). Antworte auf Deutsch."
                          : "Describe the visible lines across these four photos (in order: relaxed, raised eyebrows, smile, gentle frown). Answer in English.",
                  },
                  ...images.flatMap((img, i) => [
                    { type: "input_text", text: `Photo ${i + 1}: ${labels[i]}` },
                    { type: "input_image", image_url: img },
                  ]),
                ],
              },
            ],
            text: { format: { type: "json_schema", name: "line_observations", strict: true, schema: SCHEMA } },
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const status = upstream.status === 429 || upstream.status === 402 ? upstream.status : 502;
          return Response.json(
            {
              error:
                upstream.status === 402
                  ? "AI credits are used up. Add credits to keep analyzing photos."
                  : upstream.status === 429
                    ? "Too many requests right now. Please try again in a moment."
                    : "The analysis service is unavailable right now.",
            },
            { status },
          );
        }

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
                const ev = JSON.parse(payload) as { type?: string; delta?: string; response?: { output_text?: string } };
                if (ev.type === "response.output_text.delta" && typeof ev.delta === "string") text += ev.delta;
                else if (ev.type === "response.completed" && ev.response?.output_text) text = ev.response.output_text;
              } catch {
                /* partial frame */
              }
            }
          }
        }
        try {
          return Response.json(JSON.parse(text));
        } catch {
          return Response.json({ error: "The analysis came back unreadable." }, { status: 502 });
        }
      },
    },
  },
});
