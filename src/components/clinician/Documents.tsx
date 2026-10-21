import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Archive, ArchiveRestore, Download, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { saveDocument, documentLink, archiveFile } from "@/lib/clinician/library.functions";
import { parseTags, visibleRecords } from "@/lib/clinician/library-rules";
import type { patientDetail } from "@/lib/clinician/portal.functions";
import { Field, fieldClass, today } from "./Fields";
type Detail = Awaited<ReturnType<typeof patientDetail>>;
export function Documents({ detail, caseId, refresh }: { detail: Detail; caseId?: string; refresh: () => Promise<void> }) {
  const [upload, setUpload] = useState(false), [mode, setMode] = useState("active"), [busy, setBusy] = useState(false), [selected, setSelected] = useState(caseId ?? "");
  const save = useServerFn(saveDocument), open = useServerFn(documentLink), archive = useServerFn(archiveFile);
  return <section className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-sans text-lg font-semibold">Private documents</h2><Button onClick={() => setUpload(!upload)} disabled={!detail.cases.length}><Upload />Upload test document</Button></div>
    {upload && <form className="grid gap-4 border-y border-border py-5 sm:grid-cols-2" onSubmit={async e => {
      e.preventDefault(); const f = new FormData(e.currentTarget), form = e.currentTarget; setBusy(true);
      try {
        const file = f.get("file"); if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024) throw new Error("Choose a file under 10 MB");
        const extensions: Record<string, string> = { "application/pdf": "pdf", "text/plain": "txt", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
        const ext = extensions[file.type]; if (!ext) throw new Error("Choose a PDF, TXT, JPG, PNG or WebP file");
        const { data } = await supabase.auth.getUser(); if (!data.user) throw new Error("Sign in again");
        const path = `${data.user.id}/${detail.patient.id}/${selected}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("clinician-test-documents").upload(path, file, { contentType: file.type }); if (error) throw new Error("Could not upload private file");
        try { await save({ data: { patientId: detail.patient.id, caseId: selected, treatmentId: String(f.get("treatment")) || null, path, name: file.name, date: String(f.get("date")), tags: parseTags(String(f.get("tags"))), note: String(f.get("note")), testOnly: f.get("test") === "on" } }); }
        catch (err) { await supabase.storage.from("clinician-test-documents").remove([path]); throw err; }
        form.reset(); setUpload(false); await refresh(); toast.success("Private document saved");
      } catch (err) { toast.error(err instanceof Error ? err.message : "Could not save document"); } finally { setBusy(false); }
    }}>
      <Field label="Test document (max 10 MB)"><input name="file" type="file" accept="application/pdf,text/plain,image/jpeg,image/png,image/webp" required className={fieldClass} /></Field>
      <Field label="Document case"><select name="case" value={selected} onChange={e => setSelected(e.target.value)} required className={fieldClass}><option value="">Select case</option>{detail.cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></Field>
      <Field label="Document date"><input name="date" type="date" defaultValue={today()} required className={fieldClass} /></Field>
      <Field label="Document treatment"><select key={selected} name="treatment" className={fieldClass}><option value="">No treatment link</option>{detail.treatments.filter(t => t.case_id === selected).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
      <Field label="Document tags"><input name="tags" maxLength={1000} className={fieldClass} /></Field><Field label="Document note"><textarea name="note" maxLength={2000} className={fieldClass} /></Field>
      <label className="flex items-start gap-2 text-sm"><input name="test" type="checkbox" required />This is a test document with no real patient information.</label><Button type="submit" disabled={busy}><Upload />{busy ? "Saving…" : "Save document"}</Button>
    </form>}
    <select aria-label="Document status" value={mode} onChange={e => setMode(e.target.value)} className={`${fieldClass} max-w-xs`}><option value="active">Active documents</option><option value="archived">Archived documents</option><option value="all">All documents</option></select>
    {!visibleRecords(detail.documents, mode).length && <p className="py-6 text-sm text-muted-foreground">No documents in this view.</p>}
    <div className="divide-y divide-border">{visibleRecords(detail.documents, mode).map(d => <article key={d.id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div className="min-w-0"><h3 className="flex items-center gap-2 break-all font-sans text-sm font-semibold"><FileText className="size-4 shrink-0" />{d.file_name}</h3><p className="mt-1 text-xs text-muted-foreground">{d.document_date} · {detail.cases.find(c => c.id === d.case_id)?.title} · {d.tags.join(", ")}{d.archived ? " · Archived" : ""}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{d.note}</p></div><div className="flex gap-1"><Button size="icon" variant="outline" aria-label={`Download ${d.file_name}`} title="Download private document" onClick={async () => { try { const link = await open({ data: { id: d.id } }); const a = document.createElement("a"); a.href = link.url; a.download = d.file_name; a.click(); } catch { toast.error("Document unavailable"); } }}><Download /></Button><Button size="icon" variant="ghost" aria-label={d.archived ? "Restore document" : "Archive document"} title={d.archived ? "Restore document" : "Archive document — retain file"} onClick={async () => { try { await archive({ data: { id: d.id, kind: "document", archived: !d.archived } }); await refresh(); } catch { toast.error("Could not change document status"); } }}>{d.archived ? <ArchiveRestore /> : <Archive />}</Button></div></article>)}</div>
  </section>;
}