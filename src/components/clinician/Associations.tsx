import { useState } from "react";
import type { patientDetail } from "@/lib/clinician/portal.functions";
import { parseTags } from "@/lib/clinician/library-rules";
import { Field, fieldClass } from "./Fields";
type Detail = Awaited<ReturnType<typeof patientDetail>>;
export function CaseField({ detail, caseId }: { detail: Detail; caseId?: string | null }) {
  return <Field label="Clinical case"><select name="case" defaultValue={caseId ?? ""} className={fieldClass}><option value="">Patient-level record</option>{detail.cases.map(c => <option key={c.id} value={c.id}>{c.title}{c.archived ? " · Archived" : ""}</option>)}</select></Field>;
}
export function FileFields({ detail, caseId, initial }: { detail: Detail; caseId?: string | null; initial?: { case_id: string | null; treatment_id: string | null; tags: string[]; session_name: string } }) {
  const [selected, setSelected] = useState(initial?.case_id ?? caseId ?? "");
  return <>
    <Field label="Clinical case"><select name="case" value={selected} onChange={e => setSelected(e.target.value)} className={fieldClass}><option value="">Patient-level record</option>{detail.cases.map(c => <option key={c.id} value={c.id}>{c.title}{c.archived ? " · Archived" : ""}</option>)}</select></Field>
    <Field label="Related treatment"><select key={selected} name="treatment" defaultValue={initial?.case_id === (selected || null) ? initial?.treatment_id ?? "" : ""} className={fieldClass}><option value="">No treatment link</option>{detail.treatments.filter(t => t.case_id === (selected || null)).map(t => <option key={t.id} value={t.id}>{t.name} · {t.start_date}</option>)}</select></Field>
    <Field label="Photo session"><input name="session" maxLength={120} defaultValue={initial?.session_name ?? ""} className={fieldClass} /></Field>
    <Field label="Tags (comma-separated)"><input name="tags" defaultValue={initial?.tags.join(", ") ?? ""} maxLength={1000} className={fieldClass} /></Field>
  </>;
}
export const readFileFields = (f: FormData) => ({ caseId: String(f.get("case")) || null, treatmentId: String(f.get("treatment")) || null, tags: parseTags(String(f.get("tags") ?? "")), sessionName: String(f.get("session") ?? "") });