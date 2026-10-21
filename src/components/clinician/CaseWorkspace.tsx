import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, ArrowLeft, Save, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { archiveCase, editCase, addCaseUpdate, caseDetail } from "@/lib/clinician/library.functions";
import { caseCategory } from "@/lib/clinician/library-rules";
import { SectionTitle } from "./Shell";
import { Field, fieldClass, today } from "./Fields";
import { Documents } from "./Documents";
import { PhotoWorkspace, ProgressWorkspace, TreatmentWorkspace, NotesWorkspace, RecordHistory } from "./PatientWorkspace";
type Detail = Awaited<ReturnType<typeof caseDetail>>;
export function CaseWorkspace({ detail }: { detail: Detail }) {
  const [tab, setTab] = useState("History"), [editing, setEditing] = useState(false), [busy, setBusy] = useState(false);
  const cache = useQueryClient(), archive = useServerFn(archiveCase), edit = useServerFn(editCase), update = useServerFn(addCaseUpdate);
  const c = detail.clinicalCase;
  const refresh = async () => { await cache.invalidateQueries({ queryKey: ["clinician"] }); };
  const scoped = { ...detail, patient: { ...detail.patient, concern: c.category } };
  return <>
    <Link to="/clinician/cases" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" />My Cases</Link>
    <SectionTitle title={c.title} subtitle={`${detail.patient.display_name} · ${c.category} · ${c.archived ? "Archived" : "Active"}`} action={<div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(true)}><Pencil />Edit case</Button><Button variant="outline" disabled={busy} onClick={async () => { setBusy(true); try { await archive({ data: { id: c.id, archived: !c.archived } }); await refresh(); toast.success(c.archived ? "Case restored" : "Case archived; all files and history retained"); } catch { toast.error("Could not update case status"); } finally { setBusy(false); } }}>{c.archived ? <ArchiveRestore /> : <Archive />}{c.archived ? "Restore case" : "Archive case"}</Button></div>} />
    <div className="mb-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground"><span>Opened {c.opened_date}</span><span>Follow-up {c.follow_up_date || "Not scheduled"}</span><Link to="/clinician/patients/$id" params={{ id: c.patient_id }} className="text-primary">Patient record</Link></div>
    {c.summary && <p className="mb-5 whitespace-pre-wrap break-words text-sm">{c.summary}</p>}
    {c.outcomes && <div className="mb-6 border-l-2 border-primary pl-4"><h2 className="font-sans text-sm font-semibold">Documented outcomes</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{c.outcomes}</p></div>}
    <div className="mb-8 flex gap-1 overflow-x-auto border-b border-border pb-3">{["History", "Photos", "Documents", "Treatments", "Notes", "Progress"].map(t => <Button key={t} variant={tab === t ? "secondary" : "ghost"} onClick={() => setTab(t)}>{t}</Button>)}</div>
    {tab === "History" && <div className="grid gap-10 lg:grid-cols-2"><RecordHistory detail={detail} /><section><h2 className="mb-5 font-sans text-lg font-semibold">Add consultation / observation</h2><form className="space-y-4" onSubmit={async e => { e.preventDefault(); const f = new FormData(e.currentTarget), form = e.currentTarget; setBusy(true); try { await update({ data: { patientId: c.patient_id, caseId: c.id, date: String(f.get("date")), type: String(f.get("type")) as "Consultation" | "Follow-up" | "Observation" | "Outcome", content: String(f.get("content")) } }); await refresh(); form.reset(); toast.success("Dated observation saved"); } catch { toast.error("Could not save observation"); } finally { setBusy(false); } }}><Field label="Event date"><input type="date" name="date" required defaultValue={today()} className={fieldClass} /></Field><Field label="Record type"><select name="type" className={fieldClass}>{["Consultation", "Follow-up", "Observation", "Outcome"].map(t => <option key={t}>{t}</option>)}</select></Field><Field label="Observation / documentation"><textarea name="content" required maxLength={5000} className={fieldClass} /></Field><Button type="submit" disabled={busy}><Save />Save observation</Button></form></section></div>}
    {tab === "Photos" && <PhotoWorkspace detail={detail} refresh={refresh} caseId={c.id} />}
    {tab === "Documents" && <Documents detail={detail} refresh={refresh} caseId={c.id} />}
    {tab === "Treatments" && <TreatmentWorkspace detail={detail} refresh={refresh} caseId={c.id} />}
    {tab === "Notes" && <NotesWorkspace detail={detail} refresh={refresh} caseId={c.id} />}
    {tab === "Progress" && <ProgressWorkspace detail={scoped} refresh={refresh} caseId={c.id} />}
    <Dialog open={editing} onOpenChange={setEditing}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Edit clinical case</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={async e => { e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true); try { await edit({ data: { id: c.id, title: String(f.get("title")), category: caseCategory.parse(f.get("category")), date: String(f.get("date")), followUp: String(f.get("follow")) || null, summary: String(f.get("summary")), outcomes: String(f.get("outcomes")) } }); await refresh(); setEditing(false); } catch { toast.error("Could not save case"); } finally { setBusy(false); } }}><Field label="Case title"><input name="title" defaultValue={c.title} required maxLength={160} className={fieldClass} /></Field><Field label="Case category"><select name="category" defaultValue={c.category} className={fieldClass}>{caseCategory.options.map(t => <option key={t}>{t}</option>)}</select></Field><Field label="Case opened"><input name="date" type="date" defaultValue={c.opened_date} required className={fieldClass} /></Field><Field label="Follow-up date"><input name="follow" type="date" defaultValue={c.follow_up_date ?? ""} className={fieldClass} /></Field><Field label="Case summary"><textarea name="summary" defaultValue={c.summary} maxLength={5000} className={fieldClass} /></Field><Field label="Documented outcomes"><textarea name="outcomes" defaultValue={c.outcomes} maxLength={5000} className={fieldClass} /></Field><Button type="submit" disabled={busy}><Save />Save case</Button></form></DialogContent></Dialog>
  </>;
}