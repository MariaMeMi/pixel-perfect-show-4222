import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { caseSchema, archivePatch } from "./library-rules";
import { dateSchema } from "./rules";
const id = z.object({ id: z.string().uuid() });
export const libraryOverview = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: allowed } = await context.supabase.rpc("is_clinician");
  if (!allowed) throw new Error("Clinician access required");
  const [patients, cases, photos] = await Promise.all([
    context.supabase.from("clinician_patients").select("*").order("display_name"),
    context.supabase.from("clinician_cases").select("*").order("opened_date", { ascending: false }),
    context.supabase.from("clinician_photos").select("*").order("capture_date", { ascending: false }),
  ]);
  if (patients.error || cases.error || photos.error) throw new Error("Could not load private library");
  await context.supabase.from("clinician_audit_events").insert({ action: "library_viewed" });
  return { patients: patients.data ?? [], cases: cases.data ?? [], photos: photos.data ?? [] };
});
export const createCase = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v: z.infer<typeof caseSchema>) => caseSchema.parse(v)).handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("clinician_cases").insert({ patient_id: data.patientId, title: data.title, category: data.category, opened_date: data.date, follow_up_date: data.followUp, summary: data.summary }).select("id").single();
    if (error || !row) throw new Error("Could not create case");
    await context.supabase.from("clinician_audit_events").insert({ patient_id: data.patientId, action: "case_created" });
    return row;
  });
export const caseDetail = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v: z.infer<typeof id>) => id.parse(v)).handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("clinician_cases").select("*").eq("id", data.id).single();
    if (error || !row) throw new Error("Case unavailable or access denied");
    const [patient, photos, treatments, notes, checkins, documents, updates] = await Promise.all([
      context.supabase.from("clinician_patients").select("*").eq("id", row.patient_id).single(),
      context.supabase.from("clinician_photos").select("*").eq("case_id", row.id).order("capture_date"),
      context.supabase.from("clinician_treatments").select("*").eq("case_id", row.id).order("start_date"),
      context.supabase.from("clinician_notes").select("*").eq("case_id", row.id).order("created_at", { ascending: false }),
      context.supabase.from("clinician_checkins").select("*").eq("case_id", row.id).order("observation_date"),
      context.supabase.from("clinician_documents").select("*").eq("case_id", row.id).order("document_date"),
      context.supabase.from("clinician_case_updates").select("*").eq("case_id", row.id).order("event_date"),
    ]);
    if (!patient.data || patient.error || photos.error || treatments.error || notes.error || checkins.error || documents.error || updates.error) throw new Error("Could not load case records");
    await context.supabase.from("clinician_audit_events").insert({ patient_id: row.patient_id, action: "case_viewed" });
    return { clinicalCase: row, patient: patient.data, cases: [row], photos: photos.data ?? [], treatments: treatments.data ?? [], notes: notes.data ?? [], checkins: checkins.data ?? [], documents: documents.data ?? [], updates: updates.data ?? [] };
  });
export const editCase = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => caseSchema.omit({ patientId: true, testOnly: true }).extend({ id: z.string().uuid(), outcomes: z.string().max(5000) }).parse(v)).handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("clinician_cases").update({ title: data.title, category: data.category, opened_date: data.date, follow_up_date: data.followUp, summary: data.summary, outcomes: data.outcomes }).eq("id", data.id).select("patient_id").single();
    if (error || !row) throw new Error("Could not update case");
    await context.supabase.from("clinician_audit_events").insert({ patient_id: row.patient_id, action: "case_updated" });
    return { ok: true };
  });
export const archiveCase = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => id.extend({ archived: z.boolean() }).parse(v)).handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("clinician_cases").update(archivePatch(data.archived)).eq("id", data.id).select("patient_id").single();
    if (error || !row) throw new Error("Could not change case archive status");
    await context.supabase.from("clinician_audit_events").insert({ patient_id: row.patient_id, action: data.archived ? "case_archived" : "case_restored" });
    return { ok: true };
  });
export const addCaseUpdate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ patientId: z.string().uuid(), caseId: z.string().uuid(), date: dateSchema, type: z.enum(["Consultation", "Follow-up", "Observation", "Outcome"]), content: z.string().trim().min(1).max(5000) }).parse(v)).handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("clinician_case_updates").insert({ patient_id: data.patientId, case_id: data.caseId, event_date: data.date, event_type: data.type, content: data.content });
    if (error) throw new Error("Could not save dated observation");
    await context.supabase.from("clinician_audit_events").insert({ patient_id: data.patientId, action: "case_observation_added" });
    return { ok: true };
  });
export const saveDocument = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ patientId: z.string().uuid(), caseId: z.string().uuid(), treatmentId: z.string().uuid().nullable(), path: z.string().max(500), name: z.string().trim().min(1).max(200), date: dateSchema, tags: z.array(z.string().max(50)).max(20), note: z.string().max(2000), testOnly: z.literal(true) }).parse(v)).handler(async ({ data, context }) => {
    if (!data.path.startsWith(`${context.userId}/${data.patientId}/`) || !/\.(pdf|txt|jpg|jpeg|png|webp)$/i.test(data.path)) throw new Error("Invalid private document path");
    const { error } = await context.supabase.from("clinician_documents").insert({ patient_id: data.patientId, case_id: data.caseId, treatment_id: data.treatmentId, storage_path: data.path, file_name: data.name, document_date: data.date, tags: data.tags, note: data.note });
    if (error) throw new Error("Could not save document");
    await context.supabase.from("clinician_audit_events").insert({ patient_id: data.patientId, action: "document_uploaded" });
    return { ok: true };
  });
export const documentLink = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v: z.infer<typeof id>) => id.parse(v)).handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase.from("clinician_documents").select("storage_path,patient_id").eq("id", data.id).single();
    if (!doc) throw new Error("Document unavailable");
    const { data: link, error } = await context.supabase.storage.from("clinician-test-documents").createSignedUrl(doc.storage_path, 60, { download: true });
    if (error || !link) throw new Error("Could not open private document");
    await context.supabase.from("clinician_audit_events").insert({ patient_id: doc.patient_id, action: "document_viewed" });
    const url = new URL(link.signedUrl), browserUrl = process.env["VITE_SUPABASE_URL"];
    return { url: browserUrl ? new URL(url.pathname + url.search, browserUrl).href : link.signedUrl };
  });
export const archiveFile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => id.extend({ kind: z.enum(["photo", "document"]), archived: z.boolean() }).parse(v)).handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from(data.kind === "photo" ? "clinician_photos" : "clinician_documents").update(archivePatch(data.archived)).eq("id", data.id).select("patient_id").single();
    if (error || !row) throw new Error("Could not change file archive status");
    await context.supabase.from("clinician_audit_events").insert({ patient_id: row.patient_id, action: `${data.kind}_${data.archived ? "archived" : "restored"}` });
    return { ok: true };
  });