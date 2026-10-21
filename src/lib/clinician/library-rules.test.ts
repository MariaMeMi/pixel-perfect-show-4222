import { describe, expect, it } from "vitest";
import { archivePatch, visibleRecords, validAssociation, caseSchema } from "./library-rules";
describe("longitudinal case rules", () => {
  const record = { id: "case-1", archived: false, files: ["photo.jpg", "notes.pdf"], history: ["consultation", "treatment"] };
  it("archiving preserves files and history", () => {
    expect({ ...record, ...archivePatch(true) }).toEqual({ ...record, archived: true });
    expect(Object.keys(archivePatch(true))).toEqual(["archived"]);
  });
  it("restoring brings a case back without losing records", () => {
    const archived = { ...record, ...archivePatch(true) };
    const restored = { ...archived, ...archivePatch(false) };
    expect(visibleRecords([restored], "active")).toEqual([record]);
  });
  it("archived cases are retrievable separately", () => {
    expect(visibleRecords([record, { ...record, id: "case-2", archived: true }], "archived").map(r => r.id)).toEqual(["case-2"]);
  });
  it("a patient can have multiple independently titled cases", () => {
    const data = { patientId: "00000000-0000-4000-8000-000000000001", category: "Rosacea", date: "2026-10-21", followUp: null, summary: "", testOnly: true };
    expect(caseSchema.parse({ ...data, title: "First case" }).patientId).toBe(caseSchema.parse({ ...data, title: "Second case" }).patientId);
  });
  it("case links cannot cross patients", () => expect(validAssociation("p1", "p2")).toBe(false));
  it("treatment links must match patient and case", () => {
    expect(validAssociation("p1", "p1", { patient_id: "p1", case_id: "c2" }, "c1")).toBe(false);
    expect(validAssociation("p1", "p1", { patient_id: "p1", case_id: "c1" }, "c1")).toBe(true);
  });
});