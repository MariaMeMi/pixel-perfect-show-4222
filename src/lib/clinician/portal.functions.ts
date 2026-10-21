import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { fileAssociation } from "./library-association";
import {
  enrollmentSchema,
  patientSchema,
  photoSchema,
  dateSchema,
  canCompare,
  validRatings,
} from "./rules";
const idSchema = z.object({ id: z.string().uuid() });
export const clinicianStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("clinician_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error("Could not load clinician profile");
    return data;
  });
export const enrollClinician = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: z.infer<typeof enrollmentSchema>) => enrollmentSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("enroll_clinician", {
      p_name: data.name,
      p_role: data.role,
      p_clinic: data.clinic,
      p_country: data.country,
      p_privacy: data.privacy,
      p_test: data.testOnly,
    });
    if (error) throw new Error("Could not save clinician profile");
    return { ok: true };
  });
export const portalOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role } = await context.supabase.rpc("is_clinician");
    if (!role) throw new Error("Clinician onboarding required");
    const [p, c, h, a] = await Promise.all([
      context.supabase
        .from("clinician_patients")
        .select("*")
        .order("created_at", { ascending: false }),
      context.supabase.from("clinician_checkins").select("id,patient_id,observation_date"),
      context.supabase.from("clinician_photos").select("id,patient_id,created_at"),
      context.supabase
        .from("clinician_audit_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);
    if (p.error || c.error || h.error || a.error) throw new Error("Could not load workspace");
    await context.supabase.from("clinician_audit_events").insert({ action: "workspace_viewed" });
    return {
      patients: p.data ?? [],
      checkins: c.data ?? [],
      photos: h.data ?? [],
      activity: a.data ?? [],
    };
  });
export const addPatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: z.infer<typeof patientSchema>) => patientSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("create_clinician_patient", {
      p_name: data.name,
      p_concern: data.concern,
      p_date: data.date,
      p_follow: data.followUp as unknown as string,
      p_consent: data.consent,
      p_test: data.testOnly,
    });
    if (error || !id) throw new Error("Could not create test record");
    return { id };
  });
export const patientDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: z.infer<typeof idSchema>) => idSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { data: patient, error } = await context.supabase
      .from("clinician_patients")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !patient) throw new Error("Patient unavailable or access denied");
    const [photos, checkins, treatments, notes, cases, documents, updates] = await Promise.all([
      context.supabase
        .from("clinician_photos")
        .select("*")
        .eq("patient_id", data.id)
        .order("capture_date"),
      context.supabase
        .from("clinician_checkins")
        .select("*")
        .eq("patient_id", data.id)
        .order("observation_date"),
      context.supabase
        .from("clinician_treatments")
        .select("*")
        .eq("patient_id", data.id)
        .order("start_date"),
      context.supabase
        .from("clinician_notes")
        .select("*")
        .eq("patient_id", data.id)
        .order("created_at", { ascending: false }),
      context.supabase.from("clinician_cases").select("*").eq("patient_id", data.id).order("opened_date", { ascending: false }),
      context.supabase.from("clinician_documents").select("*").eq("patient_id", data.id).order("document_date"),
      context.supabase.from("clinician_case_updates").select("*").eq("patient_id", data.id).order("event_date"),
    ]);
    if (photos.error || checkins.error || treatments.error || notes.error || cases.error || documents.error || updates.error)
      throw new Error("Could not load patient records");
    await context.supabase
      .from("clinician_audit_events")
      .insert({ patient_id: data.id, action: "patient_viewed" });
    return {
      patient,
      photos: photos.data ?? [],
      checkins: checkins.data ?? [],
      treatments: treatments.data ?? [],
      notes: notes.data ?? [],
      cases: cases.data ?? [],
      documents: documents.data ?? [],
      updates: updates.data ?? [],
    };
  });
export const editPatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(120),
        date: dateSchema,
        followUp: dateSchema.nullable(),
        symptoms: z.string().max(5000),
        routine: z.string().max(5000),
        archived: z.boolean(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("clinician_patients")
      .update({
        display_name: data.name,
        consultation_date: data.date,
        follow_up_date: data.followUp,
        symptoms: data.symptoms,
        routine: data.routine,
        archived: data.archived,
      })
      .eq("id", data.id)
      .select("id")
      .single();
    if (error || !row) throw new Error("Could not update record");
    await context.supabase
      .from("clinician_audit_events")
      .insert({
        patient_id: data.id,
        action: data.archived ? "patient_archived" : "patient_updated",
      });
    return { ok: true };
  });
export const savePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: z.infer<typeof photoSchema>) => photoSchema.parse(v))
  .handler(async ({ data, context }) => {
    if (
      !data.path.startsWith(`${context.userId}/${data.patientId}/`) ||
      !/\.(jpg|jpeg|png|webp)$/i.test(data.path)
    )
      throw new Error("Invalid photo path");
    const { error } = await context.supabase
      .from("clinician_photos")
      .insert({
        patient_id: data.patientId,
        storage_path: data.path,
        capture_date: data.captureDate,
        facial_view: data.view,
        label: data.label,
        note: data.note,
        case_id: data.caseId ?? null,
        treatment_id: data.treatmentId ?? null,
        tags: data.tags ?? [],
        session_name: data.sessionName ?? "",
      });
    if (error) throw new Error("Could not save photo metadata");
    await context.supabase
      .from("clinician_audit_events")
      .insert({ patient_id: data.patientId, action: "photo_uploaded" });
    return { ok: true };
  });
export const photoLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: z.infer<typeof idSchema>) => idSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { data: photo } = await context.supabase
      .from("clinician_photos")
      .select("storage_path,patient_id")
      .eq("id", data.id)
      .single();
    if (!photo) throw new Error("Photo unavailable");
    const { data: link, error } = await context.supabase.storage
      .from("clinician-test-photos")
      .createSignedUrl(photo.storage_path, 60);
    if (error || !link) throw new Error("Could not open photo");
    await context.supabase
      .from("clinician_audit_events")
      .insert({ patient_id: photo.patient_id, action: "photo_viewed" });
    // Storage may return the server-local origin in drafts; replace only the origin with the browser-facing project URL.
    const browserUrl = process.env["VITE_SUPABASE_URL"];
    const signedUrl = browserUrl
      ? new URL(new URL(link.signedUrl).pathname + new URL(link.signedUrl).search, browserUrl).href
      : link.signedUrl;
    return { url: signedUrl };
  });
export const editPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        captureDate: dateSchema,
        ...fileAssociation,
        view: photoSchema.shape.view,
        label: photoSchema.shape.label,
        note: z.string().max(2000),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("clinician_photos")
      .update({
        capture_date: data.captureDate,
        facial_view: data.view,
        label: data.label,
        note: data.note,
        ...(data.caseId !== undefined ? { case_id: data.caseId } : {}),
        ...(data.treatmentId !== undefined ? { treatment_id: data.treatmentId } : {}),
        ...(data.tags !== undefined ? { tags: data.tags } : {}),
        ...(data.sessionName !== undefined ? { session_name: data.sessionName } : {}),
      })
      .eq("id", data.id)
      .select("patient_id")
      .single();
    if (error || !row) throw new Error("Could not edit photo");
    await context.supabase
      .from("clinician_audit_events")
      .insert({ patient_id: row.patient_id, action: "photo_updated" });
    return { ok: true };
  });
export const deletePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ id: z.string().uuid(), confirmed: z.literal(true) }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: photo } = await context.supabase
      .from("clinician_photos")
      .select("storage_path,patient_id")
      .eq("id", data.id)
      .single();
    if (!photo) throw new Error("Photo unavailable");
    const { error: storageError } = await context.supabase.storage
      .from("clinician-test-photos")
      .remove([photo.storage_path]);
    if (storageError) throw new Error("Could not delete photo");
    const { error } = await context.supabase.from("clinician_photos").delete().eq("id", data.id);
    if (error) throw new Error("Could not remove photo metadata");
    await context.supabase
      .from("clinician_audit_events")
      .insert({ patient_id: photo.patient_id, action: "test_photo_deleted" });
    return { ok: true };
  });
export const addCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        patientId: z.string().uuid(),
        date: dateSchema,
        caseId: z.string().uuid().nullable().optional(),
        ratings: z.record(z.number().int().min(0).max(4)),
        observations: z.string().max(5000),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: p } = await context.supabase
      .from("clinician_patients")
      .select("concern")
      .eq("id", data.patientId)
      .single();
    const { data: clinicalCase } = data.caseId ? await context.supabase.from("clinician_cases").select("category").eq("id", data.caseId).eq("patient_id", data.patientId).single() : { data: null };
    if (!p || (data.caseId && !clinicalCase) || !validRatings(data.ratings, clinicalCase?.category ?? p.concern)) throw new Error("Invalid subjective ratings");
    const { error } = await context.supabase
      .from("clinician_checkins")
      .insert({
        patient_id: data.patientId,
        observation_date: data.date,
        case_id: data.caseId ?? null,
        ratings: data.ratings,
        observations: data.observations,
      });
    if (error) throw new Error("Could not save check-in");
    await context.supabase
      .from("clinician_audit_events")
      .insert({ patient_id: data.patientId, action: "checkin_added" });
    return { ok: true };
  });
export const addTreatment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        patientId: z.string().uuid(),
        name: z.string().trim().min(1).max(160),
        caseId: z.string().uuid().nullable().optional(),
        start: dateSchema,
        end: dateSchema.nullable(),
        followUp: dateSchema.nullable(),
        type: z.string().max(160),
        notes: z.string().max(5000),
      })
      .refine((v) => !v.end || v.end >= v.start, "End date precedes start")
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("clinician_treatments")
      .insert({
        patient_id: data.patientId,
        name: data.name,
        case_id: data.caseId ?? null,
        start_date: data.start,
        end_date: data.end,
        follow_up_date: data.followUp,
        procedure_type: data.type,
        notes: data.notes,
      });
    if (error) throw new Error("Could not save treatment");
    await context.supabase
      .from("clinician_audit_events")
      .insert({ patient_id: data.patientId, action: "treatment_added" });
    return { ok: true };
  });
export const addNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        patientId: z.string().uuid(),
        content: z.string().trim().min(1).max(5000),
        caseId: z.string().uuid().nullable().optional(),
        photoA: z.string().uuid().nullable(),
        photoB: z.string().uuid().nullable(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    if (data.photoA || data.photoB) {
      const { data: photos } = await context.supabase
        .from("clinician_photos")
        .select("id,patient_id,facial_view")
        .in("id", [data.photoA ?? "", data.photoB ?? ""]);
      const a = photos?.find((p) => p.id === data.photoA),
        b = photos?.find((p) => p.id === data.photoB);
      if (!a || !b || !canCompare(a, b) || a.patient_id !== data.patientId)
        throw new Error("Select two different photos with matching facial views");
    }
    const { error } = await context.supabase
      .from("clinician_notes")
      .insert({
        patient_id: data.patientId,
        content: data.content,
        case_id: data.caseId ?? null,
        photo_a: data.photoA,
        photo_b: data.photoB,
      });
    if (error) throw new Error("Could not save note");
    await context.supabase
      .from("clinician_audit_events")
      .insert({
        patient_id: data.patientId,
        action: data.photoA ? "comparison_saved" : "note_added",
      });
    return { ok: true };
  });
export const requestDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("clinician_deletion_requests").insert({});
    if (error) throw new Error("Could not submit deletion request");
    return { ok: true };
  });
