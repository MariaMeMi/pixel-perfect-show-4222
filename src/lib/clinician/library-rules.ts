import { z } from "zod";
import { dateSchema } from "./rules";
export const caseCategory = z.enum(["Rosacea", "Acne", "Aesthetic treatment", "Post-procedure", "Other"]);
export const caseSchema = z.object({
  patientId: z.string().uuid(), title: z.string().trim().min(1).max(160),
  category: caseCategory, date: dateSchema, followUp: dateSchema.nullable(),
  summary: z.string().max(5000), testOnly: z.literal(true),
});
export const fileAssociation = {
  caseId: z.string().uuid().nullable().optional(),
  treatmentId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  sessionName: z.string().max(120).optional(),
};
export const parseTags = (value: string) => [...new Set(value.split(",").map(t => t.trim()).filter(Boolean))];
export function archivePatch(archived: boolean) { return { archived }; }
export function visibleRecords<T extends { archived: boolean }>(records: T[], mode: string) {
  return records.filter(r => mode === "all" || r.archived === (mode === "archived"));
}
export function validAssociation(patientId: string, casePatientId: string, treatment?: { patient_id: string; case_id: string | null }, caseId?: string | null) {
  return patientId === casePatientId && (!treatment || (treatment.patient_id === patientId && treatment.case_id === (caseId ?? null)));
}