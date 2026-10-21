import { describe, it, expect } from "vitest";
import {
  enrollmentSchema,
  patientSchema,
  photoSchema,
  canCompare,
  upcomingCount,
  validRatings,
} from "./rules";
describe("clinician privacy and documentation rules", () => {
  const enrollment = {
    name: "Test Clinician",
    role: "Other",
    clinic: "",
    country: "US",
    privacy: true,
    testOnly: true,
  };
  it("requires privacy acknowledgment", () =>
    expect(enrollmentSchema.safeParse({ ...enrollment, privacy: false }).success).toBe(false));
  it("requires test-only acknowledgment", () =>
    expect(enrollmentSchema.safeParse({ ...enrollment, testOnly: false }).success).toBe(false));
  const patient = {
    name: "TEST-001",
    concern: "Rosacea",
    date: "2026-10-21",
    followUp: null,
    consent: true,
    testOnly: true,
  };
  it("requires patient authorization", () =>
    expect(patientSchema.safeParse({ ...patient, consent: false }).success).toBe(false));
  it("rejects real-data patient mode", () =>
    expect(patientSchema.safeParse({ ...patient, testOnly: false }).success).toBe(false));
  it("rejects real-photo upload mode", () =>
    expect(
      photoSchema.safeParse({
        patientId: "00000000-0000-4000-8000-000000000001",
        path: "test.jpg",
        captureDate: "2026-10-21",
        view: "Front",
        label: "",
        note: "",
        testOnly: false,
      }).success,
    ).toBe(false));
  const a = { id: "a", patient_id: "p1", facial_view: "Front" };
  it("requires same patient for comparison", () =>
    expect(canCompare(a, { id: "b", patient_id: "p2", facial_view: "Front" })).toBe(false));
  it("requires matching facial views", () =>
    expect(canCompare(a, { id: "b", patient_id: "p1", facial_view: "Left" })).toBe(false));
  it("requires two distinct photos", () => expect(canCompare(a, a)).toBe(false));
  it("allows matching distinct photos", () => expect(canCompare(a, { ...a, id: "b" })).toBe(true));
  it("counts only explicit upcoming dates", () =>
    expect(
      upcomingCount(
        [
          { archived: false, follow_up_date: null },
          { archived: false, follow_up_date: "2026-10-22" },
          { archived: false, follow_up_date: "2026-10-20" },
          { archived: true, follow_up_date: "2026-10-23" },
        ],
        "2026-10-21",
      ),
    ).toBe(1));
  it("accepts subjective rosacea scale 0 to 4", () => {
    expect(validRatings({ Redness: 4, Dryness: 0 }, "Rosacea")).toBe(true);
    expect(validRatings({ Redness: 5 }, "Rosacea")).toBe(false);
  });
  it("rejects clinical severity metric", () =>
    expect(validRatings({ "Clinical severity": 3 }, "Rosacea")).toBe(false));
});
