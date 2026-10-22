import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { createAiRunIdFetch } from "@/lib/ai-run-id.server";

const MODEL = "openai/gpt-6-astra";

export const clueSectionsSchema = z.object({
  caseSummary: z.string().max(4000),
  observedPatterns: z.array(z.string().max(600)).max(12),
  clinicalClues: z.array(z.string().max(600)).max(12),
  missingInformation: z.array(z.string().max(600)).max(12),
  followUpQuestions: z.array(z.string().max(400)).min(1).max(5),
});
export type ClueSections = z.infer<typeof clueSectionsSchema>;

const SYSTEM = `You are a clinical decision-support assistant inside Rose AI for Clinicians, reviewing a synthetic TEST case for a licensed dermatologist or aesthetic practitioner. You support professional judgment; you never replace it.

Strict rules:
- Use ONLY the documented case information provided. Never assume or invent facts that are not documented.
- Never present a confirmed or suspected diagnosis. Never claim a treatment worked or that a condition improved or worsened unless the documentation explicitly supports it.
- Distinguish observed associations from proven causes.
- In "clinicalClues", phrase every item as a consideration to investigate, e.g. "Consider reviewing...", "The documented history may warrant assessment of...", "Additional information may help clarify...", "This pattern is not sufficient to establish...".
- Never generate prescriptions, medication names with dosages, units, or treatment plans.
- Photographs were NOT visually inspected; only photo metadata (dates, views, labels) is available. Note lighting/angle/quality limits when referencing photo metadata.
- If the documentation is thin, say so plainly instead of filling gaps.

Reply with a single JSON object, no markdown fences, matching exactly:
{"caseSummary": string, "observedPatterns": string[], "clinicalClues": string[], "missingInformation": string[], "followUpQuestions": string[]}
followUpQuestions: 3-5 questions the clinician may choose to ask at the next consultation.`;

type CaseBundle = {
  clinicalCase: Record<string, unknown>;
  patient: Record<string, unknown>;
  photos: Record<string, unknown>[];
  treatments: Record<string, unknown>[];
  notes: Record<string, unknown>[];
  checkins: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  updates: Record<string, unknown>[];
};

async function loadCaseBundle(supabase: any, caseId: string): Promise<CaseBundle> {
  const { data: clinicalCase, error } = await supabase.from("clinician_cases").select("*").eq("id", caseId).single();
  if (error || !clinicalCase) throw new Error("Case unavailable or access denied");
  const [patient, photos, treatments, notes, checkins, documents, updates] = await Promise.all([
    supabase.from("clinician_patients").select("concern,consultation_date,follow_up_date,symptoms,routine").eq("id", clinicalCase.patient_id).single(),
    supabase.from("clinician_photos").select("capture_date,facial_view,label,session_name,tags,note").eq("case_id", caseId).order("capture_date"),
    supabase.from("clinician_treatments").select("name,start_date,end_date,follow_up_date,procedure_type,notes").eq("case_id", caseId).order("start_date"),
    supabase.from("clinician_notes").select("content,created_at").eq("case_id", caseId).order("created_at"),
    supabase.from("clinician_checkins").select("observation_date,ratings,observations").eq("case_id", caseId).order("observation_date"),
    supabase.from("clinician_documents").select("file_name,document_date,tags,note").eq("case_id", caseId).order("document_date"),
    supabase.from("clinician_case_updates").select("event_date,event_type,content").eq("case_id", caseId).order("event_date"),
  ]);
  if (!patient.data || patient.error || photos.error || treatments.error || notes.error || checkins.error || documents.error || updates.error)
    throw new Error("Could not load case records");
  return { clinicalCase, patient: patient.data, photos: photos.data ?? [], treatments: treatments.data ?? [], notes: notes.data ?? [], checkins: checkins.data ?? [], documents: documents.data ?? [], updates: updates.data ?? [] };
}

function casePrompt(bundle: CaseBundle) {
  const c = bundle.clinicalCase as { title: string; category: string; opened_date: string; follow_up_date: string | null; summary: string | null; outcomes: string | null };
  // De-identified: the patient display name is never sent to the AI provider.
  return JSON.stringify({
    testCase: {
      title: c.title, category: c.category, openedDate: c.opened_date, followUpDate: c.follow_up_date,
      summary: c.summary, documentedOutcomes: c.outcomes,
    },
    patient: bundle.patient,
    symptomCheckins: bundle.checkins,
    treatments: bundle.treatments,
    clinicianNotes: bundle.notes,
    datedObservations: bundle.updates,
    photoMetadataOnly_notVisuallyInspected: bundle.photos,
    documentMetadataOnly: bundle.documents,
  });
}

function hasEnoughData(bundle: CaseBundle) {
  const c = bundle.clinicalCase as { summary: string | null };
  return Boolean(c.summary?.trim()) || bundle.treatments.length + bundle.checkins.length + bundle.notes.length + bundle.updates.length > 0;
}

function parseSections(raw: string): ClueSections | null {
  const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return clueSectionsSchema.parse(JSON.parse(raw.slice(start, end + 1)));
  } catch {
    return null;
  }
}

async function callGateway(apiKey: string, system: string, user: string, runId?: string) {
  const run = createAiRunIdFetch(runId);
  const openai = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: run.fetch,
  });
  const result = streamText({
    model: openai.responses(MODEL),
    system,
    messages: [{ role: "user", content: user }],
    maxRetries: 0,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const text = await result.text;
  return { text, runId: run.getRunId() };
}

function safeAiError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/credit|payment|402/i.test(message)) return new Error("AI clues are paused because AI credits are unavailable.");
  if (/rate|429/i.test(message)) return new Error("The AI service is busy right now. Please wait a moment and try again.");
  return new Error("The AI analysis could not be completed. Please try again.");
}

const caseIdInput = z.object({ caseId: z.string().uuid() });

export const listClues = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => caseIdInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: analyses, error } = await context.supabase
      .from("clinician_ai_analyses").select("*").eq("case_id", data.caseId).order("created_at", { ascending: false });
    if (error) throw new Error("Could not load AI analyses");
    const ids = (analyses ?? []).map((a: { id: string }) => a.id);
    const { data: feedback } = ids.length
      ? await context.supabase.from("clinician_ai_feedback").select("*").in("analysis_id", ids)
      : { data: [] as unknown[] };
    return { analyses: analyses ?? [], feedback: feedback ?? [] };
  });

export const generateClues = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => caseIdInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("is_clinician");
    if (!allowed) throw new Error("Clinician access required");
    const bundle = await loadCaseBundle(context.supabase, data.caseId);
    if (!hasEnoughData(bundle)) return { insufficient: true as const };
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI service is not configured yet");

    const prompt = casePrompt(bundle);
    let sections: ClueSections | null = null;
    let runId: string | undefined;
    try {
      const first = await callGateway(apiKey, SYSTEM, prompt);
      runId = first.runId;
      sections = parseSections(first.text);
      if (!sections) {
        const repair = await callGateway(
          apiKey,
          SYSTEM,
          `Your previous reply was not valid JSON. Reply with ONLY the corrected JSON object, no markdown fences, matching the required shape. Previous reply:\n${first.text.slice(0, 6000)}`,
          runId,
        );
        sections = parseSections(repair.text);
      }
    } catch (error) {
      throw safeAiError(error);
    }
    if (!sections) throw new Error("The AI reply could not be read. Please try again.");

    const sources = {
      caseSummary: Boolean((bundle.clinicalCase as { summary: string | null }).summary?.trim()),
      symptomCheckins: bundle.checkins.length,
      treatments: bundle.treatments.length,
      clinicianNotes: bundle.notes.length,
      datedObservations: bundle.updates.length,
      photoMetadata: bundle.photos.length,
      documentMetadata: bundle.documents.length,
      photosVisuallyInspected: false,
    };
    const { data: row, error } = await context.supabase
      .from("clinician_ai_analyses")
      .insert({ case_id: data.caseId, patient_id: bundle.clinicalCase.patient_id, clinician_id: context.userId, model: MODEL, sections, sources })
      .select("*").single();
    if (error || !row) throw new Error("Could not save AI analysis");
    await context.supabase.from("clinician_audit_events").insert({ patient_id: bundle.clinicalCase.patient_id, action: "ai_clues_generated" });
    return { insufficient: false as const, analysis: row };
  });

export const rateClue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      analysisId: z.string().uuid(),
      section: z.string().min(1).max(60),
      itemIndex: z.number().int().min(0).max(50),
      rating: z.enum(["Useful", "Not Relevant", "Incorrect"]),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: analysis } = await context.supabase
      .from("clinician_ai_analyses").select("patient_id").eq("id", data.analysisId).single();
    if (!analysis) throw new Error("Analysis unavailable or access denied");
    const { error } = await context.supabase.from("clinician_ai_feedback").upsert(
      { analysis_id: data.analysisId, clinician_id: context.userId, section: data.section, item_index: data.itemIndex, rating: data.rating },
      { onConflict: "analysis_id,section,item_index" },
    );
    if (error) throw new Error("Could not save feedback");
    await context.supabase.from("clinician_audit_events").insert({ patient_id: analysis.patient_id, action: "ai_clue_rated" });
    return { ok: true };
  });

export const askClueFollowup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => caseIdInput.extend({ question: z.string().trim().min(1).max(1000) }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("is_clinician");
    if (!allowed) throw new Error("Clinician access required");
    const bundle = await loadCaseBundle(context.supabase, data.caseId);
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI service is not configured yet");
    try {
      const { text } = await callGateway(
        apiKey,
        `${SYSTEM}\n\nThe clinician asks a follow-up question about this case. Answer concisely (under 200 words) using only the documented information; say plainly when the documentation does not contain the answer.`,
        `Case data:\n${casePrompt(bundle)}\n\nClinician question: ${data.question}`,
      );
      await context.supabase.from("clinician_audit_events").insert({ patient_id: bundle.clinicalCase.patient_id, action: "ai_followup_asked" });
      return { answer: text.trim() || "The AI did not provide an answer. Please try rephrasing the question." };
    } catch (error) {
      throw safeAiError(error);
    }
  });
