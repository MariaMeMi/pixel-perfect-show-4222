import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createCase, libraryOverview } from "@/lib/clinician/library.functions";
import { caseCategory, visibleRecords } from "@/lib/clinician/library-rules";
import { Field, fieldClass, today } from "./Fields";
import { EmptyState } from "./Shell";
type Library = Awaited<ReturnType<typeof libraryOverview>>;
export function AddCaseButton({ patients, patientId }: { patients: Library["patients"]; patientId?: string }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const create = useServerFn(createCase), cache = useQueryClient(), navigate = useNavigate();
  return <><Button disabled={!patients.length} onClick={() => setOpen(true)}><Plus />New case</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Create test case</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={async e => {
        e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true);
        try {
          const row = await create({ data: { patientId: String(f.get("patient")), title: String(f.get("title")), category: caseCategory.parse(f.get("category")), date: String(f.get("date")), followUp: String(f.get("follow")) || null, summary: String(f.get("summary")), testOnly: (f.get("test") === "on") as true } });
          await cache.invalidateQueries({ queryKey: ["clinician"] }); setOpen(false);
          await navigate({ to: "/clinician/cases/$id", params: { id: row.id } });
        } catch { toast.error("Could not create case. Confirm test-only use."); } finally { setBusy(false); }
      }}>
        <Field label="Patient"><select name="patient" defaultValue={patientId ?? ""} required className={fieldClass}><option value="">Select patient</option>{patients.map(p => <option key={p.id} value={p.id}>{p.display_name}{p.archived ? " · Archived patient" : ""}</option>)}</select></Field>
        <Field label="Case title"><input name="title" required maxLength={160} className={fieldClass} /></Field>
        <Field label="Case category"><select name="category" className={fieldClass}>{caseCategory.options.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Case opened"><input type="date" name="date" defaultValue={today()} required className={fieldClass} /></Field>
        <Field label="Follow-up date"><input type="date" name="follow" className={fieldClass} /></Field>
        <Field label="Case summary"><textarea name="summary" maxLength={5000} className={fieldClass} /></Field>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="test" required />This case contains only non-identifying test data.</label>
        <Button type="submit" disabled={busy}><Plus />{busy ? "Creating…" : "Create case"}</Button>
      </form>
    </DialogContent></Dialog></>;
}
export function CaseList({ cases, patients }: { cases: Library["cases"]; patients: Library["patients"] }) {
  const [search, setSearch] = useState(""), [mode, setMode] = useState("active"), [category, setCategory] = useState(""), [patientId, setPatientId] = useState("");
  const rows = visibleRecords(cases, mode).filter(c => (!patientId || c.patient_id === patientId) && (!category || c.category === category) && [c.title, c.summary, c.outcomes, patients.find(p => p.id === c.patient_id)?.display_name].join(" ").toLowerCase().includes(search.toLowerCase()));
  return <section><div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><input aria-label="Search cases" placeholder="Search case history" value={search} onChange={e => setSearch(e.target.value)} className={`${fieldClass} pl-10`} /></div>
    <select aria-label="Case status" value={mode} onChange={e => setMode(e.target.value)} className={fieldClass}><option value="active">Active cases</option><option value="archived">Archived cases</option><option value="all">All cases</option></select>
    <select aria-label="Filter case category" value={category} onChange={e => setCategory(e.target.value)} className={fieldClass}><option value="">All categories</option>{caseCategory.options.map(c => <option key={c}>{c}</option>)}</select>
    <select aria-label="Filter case patient" value={patientId} onChange={e => setPatientId(e.target.value)} className={fieldClass}><option value="">All patients</option>{patients.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}</select>
  </div>{!rows.length ? <EmptyState title="No matching cases" description={cases.length ? "No cases match these filters." : "No clinical test cases recorded yet."} /> : <div className="divide-y divide-border border-y border-border">{rows.map(c => <Link key={c.id} to="/clinician/cases/$id" params={{ id: c.id }} className="flex items-start justify-between gap-4 py-5"><div className="min-w-0"><h2 className="break-words font-sans font-semibold">{c.title}</h2><p className="mt-1 text-sm text-muted-foreground">{patients.find(p => p.id === c.patient_id)?.display_name} · {c.category} · {c.opened_date}{c.archived ? " · Archived" : ""}</p><p className="mt-2 line-clamp-2 break-words text-sm text-muted-foreground">{c.summary}</p></div><ArrowUpRight className="mt-1 size-4 shrink-0 text-primary" /></Link>)}</div>}</section>;
}