import { z } from "zod";
import { fileAssociation } from "./library-association";
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");
export const concernSchema = z.enum(["Rosacea", "Acne", "Post-procedure", "Other"]);
export const viewSchema = z.enum(["Front", "Left", "Right", "Other"]);
export const enrollmentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.enum(["Dermatologist", "Aesthetic Practitioner", "Other"]),
  clinic: z.string().max(160),
  country: z.string().trim().min(1).max(80),
  privacy: z.literal(true),
  testOnly: z.literal(true),
});
export const patientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  concern: concernSchema,
  date: dateSchema,
  followUp: dateSchema.nullable(),
  consent: z.literal(true),
  testOnly: z.literal(true),
});
export const photoSchema = z.object({
  ...fileAssociation,
  patientId: z.string().uuid(),
  path: z.string().max(500),
  captureDate: dateSchema,
  view: viewSchema,
  label: z.enum(["", "Baseline", "Follow-up", "Before treatment", "After treatment"]),
  note: z.string().max(2000),
  testOnly: z.literal(true),
});
export const metrics: Record<string, string[]> = {
  Rosacea: ["Redness", "Flushing episodes", "Burning or stinging", "Dryness", "Skin sensitivity"],
  Acne: ["Breakouts", "Irritation", "Dryness", "Treatment adherence"],
  "Post-procedure": ["Discomfort", "Redness", "Dryness"],
  Other: ["Discomfort", "Dryness", "Sensitivity"],
};
export function canCompare(
  a: { id: string; patient_id: string; facial_view: string },
  b: { id: string; patient_id: string; facial_view: string },
) {
  return a.id !== b.id && a.patient_id === b.patient_id && a.facial_view === b.facial_view;
}
export function upcomingCount(
  patients: { archived: boolean; follow_up_date: string | null }[],
  today: string,
) {
  return patients.filter(
    (p) => !p.archived && p.follow_up_date !== null && p.follow_up_date >= today,
  ).length;
}
export function validRatings(ratings: Record<string, number>, concern: string) {
  return (
    Object.entries(ratings).length > 0 &&
    Object.entries(ratings).every(
      ([k, v]) => metrics[concern]?.includes(k) && Number.isInteger(v) && v >= 0 && v <= 4,
    )
  );
}
export const clinicianHead = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Rose AI for Clinicians` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Rose AI for Clinicians` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex,nofollow" },
  ],
});
