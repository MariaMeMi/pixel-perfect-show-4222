import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ThumbsUp, Minus, ThumbsDown, Save, MessageCircleQuestion, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateClues, listClues, rateClue, askClueFollowup } from "@/lib/clinician/clues.functions";
import { addNote } from "@/lib/clinician/portal.functions";
import type { ClueSections } from "@/lib/clinician/clues.functions";
import type { caseDetail } from "@/lib/clinician/library.functions";
import { fieldClass } from "./Fields";

type Detail = Awaited<ReturnType<typeof caseDetail>>;
type Analysis = { id: string; created_at: string; model: string; sections: ClueSections; sources: Record<string, unknown> };
type Feedback = { analysis_id: string; section: string; item_index: number; rating: string };

const NOTICE = "AI-generated clinical support. Not a diagnosis or treatment recommendation. Requires independent clinician review.";

const SECTIONS: { key: keyof ClueSections; title: string; list: boolean }[] = [
  { key: "caseSummary", title: "Case Summary", list: false },
  { key: "observedPatterns", title: "Observed Patterns", list: true },
  { key: "clinicalClues", title: "Clinical Clues", list: true },
  { key: "missingInformation", title: "Missing Information", list: true },
  { key: "followUpQuestions", title: "Suggested Follow-Up Questions", list: true },
];

function sourceLabel(sources: Record<string, unknown>) {
  const parts: string[] = [];
  if (sources.caseSummary) parts.push("case summary");
  const counts: [string, string][] = [
    ["symptomCheckins", "symptom check-in"], ["treatments", "treatment"], ["clinicianNotes", "note"],
    ["datedObservations", "dated observation"], ["photoMetadata", "photo metadata"], ["documentMetadata", "document metadata"],
  ];
  for (const [key, label] of counts) {
    const n = Number(sources[key] ?? 0);
    if (n > 0) parts.push(`${n} ${label}${n === 1 ? "" : "s"}`);
  }
  return parts.length ? parts.join(", ") : "case record";
}

export function CluesWorkspace({ detail, refresh }: { detail: Detail; refresh: () => Promise<void> }) {
  const caseId = detail.clinicalCase.id;
  const patientId = detail.clinicalCase.patient_id;
  const cache = useQueryClient();
  const generate = useServerFn(generateClues), rate = useServerFn(rateClue), ask = useServerFn(askClueFollowup), saveNote = useServerFn(addNote);
  const [busy, setBusy] = useState(false), [question, setQuestion] = useState(""), [answer, setAnswer] = useState(""), [asking, setAsking] = useState(false);
  const { data } = useQuery({
    queryKey: ["clinician", "clues", caseId],
    queryFn: () => listClues({ data: { caseId } }),
  });
  const analyses = (data?.analyses ?? []) as Analysis[];
  const feedback = (data?.feedback ?? []) as Feedback[];
  const latest = analyses[0];

  const onGenerate = async () => {
    setBusy(true);
    try {
      const result = await generate({ data: { caseId } });
      if (result.insufficient) {
        toast.info("Not enough documented information yet — add a case summary, check-ins, treatments, or notes first.");
      } else {
        toast.success("AI clues generated");
      }
      await cache.invalidateQueries({ queryKey: ["clinician", "clues", caseId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The AI analysis could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const onRate = async (section: string, itemIndex: number, rating: "Useful" | "Not Relevant" | "Incorrect") => {
    if (!latest) return;
    try {
      await rate({ data: { analysisId: latest.id, section, itemIndex, rating } });
      await cache.invalidateQueries({ queryKey: ["clinician", "clues", caseId] });
    } catch {
      toast.error("Could not save feedback");
    }
  };

  const onSaveToNotes = async (sectionTitle: string, text: string) => {
    try {
      await saveNote({
        data: {
          patientId,
          caseId,
          photoA: null,
          photoB: null,
          content: `[AI-generated — requires independent clinician review] ${sectionTitle}: ${text}`,
        },
      });
      await refresh();
      toast.success("Saved to case notes, labeled as AI-generated");
    } catch {
      toast.error("Could not save to notes");
    }
  };

  const onAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setAnswer("");
    try {
      const result = await ask({ data: { caseId, question: question.trim() } });
      setAnswer(result.answer);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The AI could not answer right now.");
    } finally {
      setAsking(false);
    }
  };

  const ratingFor = (section: string, index: number) =>
    latest ? feedback.find((f) => f.analysis_id === latest.id && f.section === section && f.item_index === index)?.rating : undefined;

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <p>{NOTICE} Photographs are not visually inspected; only photo metadata and written case information are used. Test data only.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onGenerate} disabled={busy}>
          {busy ? <RefreshCw className="animate-spin" /> : latest ? <RefreshCw /> : <Sparkles />}
          {busy ? "Analyzing case…" : latest ? "Regenerate AI Clues" : "Generate AI Clues"}
        </Button>
        {latest && (
          <p className="text-xs text-muted-foreground">
            Generated {new Date(latest.created_at).toLocaleString()} · Sources: {sourceLabel(latest.sources)}
          </p>
        )}
      </div>

      {!latest && !busy && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No AI analysis yet. Generate AI Clues to review this case's documented concerns, patterns, and questions worth investigating.
        </div>
      )}

      {latest && (
        <div className="grid gap-6 lg:grid-cols-2">
          {SECTIONS.map(({ key, title, list }) => {
            const value = latest.sections[key];
            const items = list ? (value as string[]) : [];
            if (list && items.length === 0) return null;
            return (
              <section key={key} className="rounded-xl border border-border bg-card p-5">
                <h2 className="mb-3 font-sans text-base font-semibold">{title}</h2>
                {!list && <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{value as string}</p>}
                {list && (
                  <ul className="space-y-3">
                    {items.map((item, i) => {
                      const rating = ratingFor(key, i);
                      return (
                        <li key={i} className="rounded-lg bg-muted/50 p-3 text-sm">
                          <p className="whitespace-pre-wrap break-words">{item}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            <Button size="sm" variant={rating === "Useful" ? "secondary" : "ghost"} onClick={() => onRate(key, i, "Useful")} title="Useful"><ThumbsUp className="size-3.5" /></Button>
                            <Button size="sm" variant={rating === "Not Relevant" ? "secondary" : "ghost"} onClick={() => onRate(key, i, "Not Relevant")} title="Not relevant"><Minus className="size-3.5" /></Button>
                            <Button size="sm" variant={rating === "Incorrect" ? "secondary" : "ghost"} onClick={() => onRate(key, i, "Incorrect")} title="Incorrect"><ThumbsDown className="size-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => onSaveToNotes(title, item)} title="Save to case notes"><Save className="size-3.5" />Save to notes</Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!list && (
                  <div className="mt-3">
                    <Button size="sm" variant="ghost" onClick={() => onSaveToNotes(title, value as string)}><Save className="size-3.5" />Save to notes</Button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-sans text-base font-semibold"><MessageCircleQuestion className="size-4" />Ask a follow-up question about this case</h2>
        <form onSubmit={onAsk} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={1000}
            placeholder="e.g. What documented triggers coincide with flushing episodes?"
            className={fieldClass}
          />
          <Button type="submit" disabled={asking || !question.trim()}>{asking ? "Asking…" : "Ask"}</Button>
        </form>
        {answer && <p className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-muted/50 p-4 text-sm">{answer}</p>}
      </section>

      {analyses.length > 1 && (
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer">Previous analyses ({analyses.length - 1})</summary>
          <ul className="mt-2 space-y-1">
            {analyses.slice(1).map((a) => (
              <li key={a.id}>{new Date(a.created_at).toLocaleString()} · Sources: {sourceLabel(a.sources)}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
