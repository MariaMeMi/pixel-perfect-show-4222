import { aiHeaders } from "@/lib/ai-auth-header";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Chips, OptionCard, ProgressBar, Question, SingleList } from "@/components/onboarding/ui";
import { BaselineCapture } from "@/components/onboarding/BaselineCapture";
import { FaceMap } from "@/components/FaceMap";
import { FaceLines } from "@/components/FaceLines";
import { ScoreRing } from "@/components/ScoreRing";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/experiment";
import { EmailGate } from "@/components/EmailGate";
import { RESUME_KEY, SaveDay1 } from "@/components/onboarding/SaveDay1";
import { useI18n } from "@/lib/i18n";
import { addEntry, loadProfile } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { RosieGuide } from "@/components/RosieGuide";
import type { Analysis } from "@/lib/types";
import type { LineArea, LineLevel } from "@/lib/botox";
import {
  BOTOX_AREAS, BOTOX_PRODUCTS, BOTOX_WHEN, DIAGNOSED, DRY_EXPERIENCE, DRY_USING, GOALS, INFLUENCES, LINE_AREAS,
  LINE_DOING, NONE_TRIED, NOT_SURE, ONBOARDING_KEY, RATINGS, STOP_REASONS, SYMPTOMS, TREATMENTS, UNDERSTAND,
  buildSteps, closingLine, emptyData, profileSections, toggle, wantsBotox,
  type GoalKey, type OnboardingData, type StepId, type TreatmentResult,
} from "@/lib/onboarding/flow";

export { ONBOARDING_KEY };

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Let's get to know your skin — Rose AI" },
      { name: "description", content: "Tell Rose AI what you'd like to understand and create your personal skin starting point in about 2 minutes." },
      { property: "og:title", content: "Let's get to know your skin — Rose AI" },
      { property: "og:description", content: "Create your personal skin baseline and start your skin timeline with Rose AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

type LineRes = Record<LineArea, { level: LineLevel; noticed: string }> & { summary: string };
const LINE_NAMES = { forehead: "Forehead lines", glabella: "Frown lines", eyes: "Crow's-feet area" };
const LEVELS: Record<string, string> = { not_prominent: "Not prominent", visible_with_expression: "Visible with expression", visible_at_rest: "Visible at rest" };
const BUILD_STEPS = ["Reading your photo", "Saving your Day 1"];

function Onboarding() {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const [d, setD] = useState<OnboardingData>(emptyData);
  const [i, setI] = useState(0);
  const [photo, setPhoto] = useState<string>();
  const [built, setBuilt] = useState(0);
  const [redRes, setRedRes] = useState<Analysis>();
  const [lineRes, setLineRes] = useState<LineRes>();
  const [activeLine, setActiveLine] = useState<LineArea>("forehead");
  const [linePending, setLinePending] = useState(false);
  const [acctEmail, setAcctEmail] = useState<string>();
  const tracked = useRef(new Set<string>());
  const set = (p: Partial<OnboardingData>) => setD((x) => ({ ...x, ...p }));
  const once = (e: Parameters<typeof track>[0]) => { if (!tracked.current.has(e)) { tracked.current.add(e); track(e, "onboarding"); } };

  const steps = useMemo(() => buildSteps(d), [d]);
  const step = steps[Math.min(i, steps.length - 1)] as StepId;
  const retainPhotos = useMemo(() => (typeof window === "undefined" ? true : loadProfile().retainPhotos), []);

  useEffect(() => {
    if (step === "r_diagnosed") once("redness_branch_started");
    if (step === "l_areas") once("wrinkle_branch_started");
    if (step === "b_when") once("botox_branch_started");
    if (step === "d_experience") once("dryness_branch_started");
    if (step === "reflection") once("reflection_screen_viewed");
    window.scrollTo({ top: 0 });
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => {
    if (step === "welcome") once("onboarding_started");
    if (step === "goals") once("goal_selected");
    if (step === "r_tried") once("treatment_history_completed");
    setI((n) => Math.min(n + 1, steps.length - 1));
  };
  const back = () => setI((n) => Math.max(0, n - 1));

  /* ---------- baseline: reuse the existing redness reading, then save as Day 1 ---------- */
  // Resume after a full-page Google/Apple redirect
  useEffect(() => {
    const raw = sessionStorage.getItem(RESUME_KEY);
    if (!raw) return;
    sessionStorage.removeItem(RESUME_KEY);
    try {
      const saved = JSON.parse(raw) as { d: OnboardingData; photo: string };
      setD(saved.d); setPhoto(saved.photo);
      void (async () => {
        for (let k = 0; k < 10; k++) {
          const { data } = await supabase.auth.getSession();
          if (data.session) { setAcctEmail(data.session.user.email ?? undefined); break; }
          await new Promise((r) => setTimeout(r, 300));
        }
        void createBaseline(saved.d, saved.photo);
      })();
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function createBaseline(d0: OnboardingData = d, photo0: string | undefined = photo) {
    const d = d0; const photo = photo0;
    if (!photo) return;
    setI(buildSteps(d).indexOf("building")); setBuilt(0);
    const date = new Date().toISOString();
    let entryId: string | undefined;
    const headers = await aiHeaders();
    const wantLines = wantsBotox(d) || d.goals.includes("lines");
    setLinePending(wantLines);
    const linesP = wantLines
      ? fetch("/api/botox", { method: "POST", headers, body: JSON.stringify({ images: [photo], lang }) })
           .then(async (r) => {
             const j = await r.json();
             if (r.ok && j.forehead && j.glabella && j.eyes) {
               const baseline = j as LineRes;
               // A relaxed photo cannot establish whether a line appears with expression.
               const atRest = (area: LineArea) => ({ ...baseline[area], level: baseline[area].level === "visible_at_rest" ? "visible_at_rest" as const : "not_prominent" as const });
               setLineRes({ ...baseline, forehead: atRest("forehead"), glabella: atRest("glabella"), eyes: atRest("eyes") });
               track("analysis_completed", "botox_information");
             }
           })
          .catch(() => undefined)
           .finally(() => setLinePending(false))
      : Promise.resolve();
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers, body: JSON.stringify({ image: photo, lang }) });
      const a = (await res.json()) as Partial<Analysis> & { error?: string };
      if (res.ok && typeof a.score === "number") {
        track("baseline_photo_analysis_completed", "onboarding");
        track("analysis_completed", "redness");
        setRedRes(a as Analysis);
        entryId = `baseline-${Date.now()}`;
        addEntry({ id: entryId, date, analysis: a as Analysis, photo: retainPhotos ? photo : undefined, feeling: undefined, triggers: [] });
      } else toast.error("We couldn't read this photo, but your baseline photo is saved.");
    } catch { toast.error("We couldn't read this photo, but your baseline photo is saved."); }
    setBuilt(1);
    // Redness results can be unlocked while the independent lines reading finishes.
    // For a lines-only goal, wait for that reading so its results can be emailed.
    if (wantLines && !d.goals.includes("redness")) await linesP;
    const final: OnboardingData = { ...d, baselineEntryId: entryId, baselineDate: date, completedAt: date, baselinePhoto: !entryId && retainPhotos ? photo : undefined };
    try { localStorage.setItem(ONBOARDING_KEY, JSON.stringify(final)); }
    catch { localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ ...final, baselinePhoto: undefined })); }
    setD(final);
    track("skin_profile_created", "onboarding"); track("onboarding_completed", "onboarding");
    setI(buildSteps(final).indexOf("gate"));
  }

  /* ---------- screens ---------- */
  const tg = (key: keyof OnboardingData, v: string, exclusive: string[] = []) => set({ [key]: toggle(d[key] as string[], v, exclusive) } as Partial<OnboardingData>);
  let body: React.ReactNode = null;
  let valid = true;
  let cta = "Continue";

  if (step === "welcome") {
    cta = "Get started";
    body = (
      <div className="flex min-h-[55vh] flex-col justify-center text-center animate-in fade-in duration-500">
        <p className="eyebrow">Rose AI</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground">Let's get to know your skin 🌹</h1>
        <p className="mx-auto mt-4 max-w-xs text-muted-foreground">Tell Rose AI what you'd like to understand, and we'll create your personal starting point.</p>
        <p className="mt-6 text-xs text-muted-foreground">About 2 minutes</p>
      </div>
    );
  } else if (step === "goals") {
    valid = d.goals.length > 0;
    body = <Question title="What would you like to understand about your skin?" hint="Choose everything that matters to you.">
      <div className="space-y-2">{GOALS.map((g) => <OptionCard key={g.key} icon={g.icon} label={g.title} text={g.text} selected={d.goals.includes(g.key)} onClick={() => set({ goals: toggle(d.goals, g.key) as GoalKey[] })} />)}</div>
    </Question>;
  } else if (step === "r_diagnosed") {
    valid = !!d.diagnosed;
    body = <Question title="Have you been diagnosed with rosacea?"><SingleList options={DIAGNOSED} value={d.diagnosed} onChange={(v) => set({ diagnosed: v })} /></Question>;
  } else if (step === "r_symptoms") {
    valid = d.symptoms.length > 0;
    body = <Question title="What does your skin experience?" hint="Select all that apply."><Chips options={SYMPTOMS} value={d.symptoms} onToggle={(v) => tg("symptoms", v)} /></Question>;
  } else if (step === "r_understand") {
    valid = !!d.understand;
    body = <Question title="What would you most like to understand?"><SingleList options={UNDERSTAND} value={d.understand} onChange={(v) => set({ understand: v })} /></Question>;
  } else if (step === "r_tried") {
    valid = d.tried.length > 0;
    body = <Question title="What have you already tried?" hint="Select everything that applies.">
      <div className="space-y-5">
        {TREATMENTS.map((g) => <div key={g.group}><p className="eyebrow mb-2">{g.group}</p><Chips options={g.items} value={d.tried} onToggle={(v) => tg("tried", v, [NONE_TRIED])} /></div>)}
        <Chips options={[NONE_TRIED]} value={d.tried} onToggle={(v) => tg("tried", v, [NONE_TRIED])} />
      </div>
    </Question>;
  } else if (step.startsWith("r_follow:")) {
    const t = step.slice(9);
    const r: TreatmentResult = d.results[t] ?? { stopReasons: [] };
    const up = (p: Partial<TreatmentResult>) => set({ results: { ...d.results, [t]: { ...r, ...p } } });
    valid = r.stillUsing !== undefined && !!r.rating;
    body = <Question title={`You mentioned ${t.split(" / ")[0]}.`} hint="This is your own experience — Rose AI doesn't judge whether a treatment worked.">
      <div className="space-y-5">
        <div><p className="mb-2 text-sm font-medium text-foreground">Are you currently using it?</p>
          <div className="flex gap-2">{(["Yes", "No"] as const).map((o) => <button key={o} type="button" onClick={() => up({ stillUsing: o === "Yes" })} className={`flex-1 rounded-full border py-3 text-sm ${r.stillUsing === (o === "Yes") ? "border-primary bg-accent text-foreground" : "border-border bg-card text-muted-foreground"}`}>{o}</button>)}</div></div>
        <div><p className="mb-2 text-sm font-medium text-foreground">What did you notice while using it?</p>
          <Chips options={RATINGS.map((x) => x[1])} value={r.rating ? [RATINGS.find((x) => x[0] === r.rating)![1]] : []} onToggle={(l) => up({ rating: RATINGS.find((x) => x[1] === l)![0] })} /></div>
        {r.stillUsing === false && <div><p className="mb-2 text-sm font-medium text-foreground">Why did you stop?</p><Chips options={STOP_REASONS} value={r.stopReasons} onToggle={(v) => up({ stopReasons: toggle(r.stopReasons, v) })} /></div>}
      </div>
    </Question>;
  } else if (step === "r_influences") {
    valid = d.influences.length > 0;
    body = <Question title="Have you noticed anything that seems to affect your skin?" hint="You don't need to know for sure. Rose AI can help you organize your observations over time.">
      <Chips options={[...INFLUENCES, NOT_SURE]} value={d.influences} onToggle={(v) => tg("influences", v, [NOT_SURE])} />
      {d.influences.includes(NOT_SURE) && <div className="surface mt-5 p-4 text-sm text-foreground animate-in fade-in">That's completely fine. You don't need to know your patterns yet — Rose AI is designed to help you organize what you notice over time.</div>}
    </Question>;
  } else if (step === "l_areas") {
    valid = d.lineAreas.length > 0;
    body = <Question title="What would you like to track?" hint="Select all that apply."><Chips options={LINE_AREAS} value={d.lineAreas} onToggle={(v) => tg("lineAreas", v)} /></Question>;
  } else if (step === "l_doing") {
    valid = d.lineDoing.length > 0;
    body = <Question title="Are you currently doing anything for these concerns?" hint="Select all that apply. We just note what you already do."><Chips options={LINE_DOING} value={d.lineDoing} onToggle={(v) => tg("lineDoing", v, ["Nothing currently"])} /></Question>;
  } else if (step === "b_when") {
    valid = !!d.botoxWhen;
    body = <Question title="When was your most recent Botox or neuromodulator treatment?"><SingleList options={BOTOX_WHEN} value={d.botoxWhen} onChange={(v) => set({ botoxWhen: v })} /></Question>;
  } else if (step === "b_areas") {
    valid = d.botoxAreas.length > 0;
    body = <Question title="Which areas are you tracking?"><Chips options={BOTOX_AREAS} value={d.botoxAreas} onToggle={(v) => tg("botoxAreas", v)} /></Question>;
  } else if (step === "b_product") {
    cta = d.botoxProduct ? "Continue" : "Skip";
    body = <Question title="Do you know which product was used?" hint="Optional."><Chips options={BOTOX_PRODUCTS} value={d.botoxProduct ? [d.botoxProduct] : []} onToggle={(v) => set({ botoxProduct: d.botoxProduct === v ? "" : v })} /></Question>;
  } else if (step === "d_experience") {
    valid = d.dryExperience.length > 0;
    body = <Question title="What are you experiencing?" hint="Select all that apply."><Chips options={DRY_EXPERIENCE} value={d.dryExperience} onToggle={(v) => tg("dryExperience", v)} /></Question>;
  } else if (step === "d_using") {
    valid = d.dryUsing.length > 0;
    body = <Question title="What are you currently using?"><Chips options={DRY_USING} value={d.dryUsing} onToggle={(v) => tg("dryUsing", v, ["Nothing currently"])} /></Question>;
  } else if (step === "reflection") {
    cta = "Create my baseline";
    const secs = profileSections(d).filter((s) => ["Your goal", "You're tracking", "Most recent treatment"].includes(s.label));
    body = <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h1 className="font-display text-3xl leading-tight text-foreground">We're getting to know your skin 🌹</h1>
      <div className="surface mt-6 space-y-5 p-5">
        {secs.map((s) => <div key={s.label}><p className="eyebrow">{s.label}</p><p className="mt-1 font-display text-xl text-foreground">{s.items.join(" + ")}</p></div>)}
      </div>
      <p className="mt-5 text-sm text-muted-foreground">
        {d.goals.includes("dryness") && d.goals.length === 1 ? "Rose AI will help you compare how your skin looks and how you report it feels over time."
          : wantsBotox(d) && d.goals.length === 1 ? "Rose AI will help you document visible changes over time."
          : "Rose AI will use your future check-ins to build a personal timeline around that goal."}
      </p>
    </div>;
  } else if (step === "baseline") {
    cta = "Use this photo";
    valid = !!photo;
    body = <Question title="Let's create your baseline 📸" hint="Your first photo gives Rose AI a starting point for comparing visible changes over time.">
      <BaselineCapture photo={photo} retainPhotos={retainPhotos} onStart={() => once("baseline_photo_started")} onPhoto={(u) => { setPhoto(u); once("baseline_photo_uploaded"); }} />
    </Question>;
  } else if (step === "signup") {
    body = <SaveDay1
      beforeRedirect={() => { try { sessionStorage.setItem(RESUME_KEY, JSON.stringify({ d, photo })); } catch { /* too large */ } }}
      onDone={(em) => { setAcctEmail(em); void createBaseline(); }} />;
  } else if (step === "building") {
    body = <div className="flex min-h-[55vh] flex-col justify-center">
      <h1 className="font-display text-3xl text-foreground">Creating your starting skin profile…</h1>
      <ul className="mt-8 space-y-4">{BUILD_STEPS.map((s, k) => (
        <li key={s} className={`flex items-center gap-3 text-sm transition-opacity duration-300 ${k <= built ? "opacity-100" : "opacity-30"}`}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full gradient-rose text-primary-foreground">{k < built ? <Check className="h-3.5 w-3.5" /> : k === built ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}</span>
          <span className="text-foreground">{s}</span>
        </li>))}</ul>
    </div>;
  } else if (step === "gate") {
     const exp = d.goals.includes("redness") || !(wantsBotox(d) || d.goals.includes("lines")) ? "redness" : "botox_information";
    body = <EmailGate experience={exp} defaultEmail={acctEmail} onDone={() => { track("results_viewed", exp); setI(steps.indexOf("profile")); }}
      results={redRes ? { score: redRes.score, summary: redRes.summary, points: [...(redRes.observations ?? []), ...(redRes.tips ?? [])] } : lineRes ? { summary: lineRes.summary } : undefined} />;
  } else if (step === "profile") {
    body = <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <p className="eyebrow">Your first results</p>
      {redRes && <section className="mt-4 space-y-5" aria-label="Visible redness results">
        <div className="surface-lift gradient-dawn flex flex-col items-center gap-4 p-6 text-center">
          <p className="font-display text-2xl text-foreground">Rosacea AI · visible redness</p>
          <ScoreRing score={redRes.score} />
          <p className="max-w-xs text-sm leading-relaxed text-secondary-foreground">{redRes.summary}</p>
        </div>
        <div className="surface p-5">
          <h2 className="font-display text-xl text-foreground">Where redness shows most</h2>
          <div className="mt-5"><FaceMap regions={redRes.regions} /></div>
        </div>
        {redRes.observations?.length > 0 && <ul className="space-y-1 text-sm text-muted-foreground">{redRes.observations.slice(0, 3).map((o) => <li key={o}>• {o}</li>)}</ul>}
      </section>}
      {lineRes && <section className="mt-7 space-y-4" aria-label="Visible facial-lines results">
        <div>
          <h2 className="font-display text-2xl text-foreground">Botox AI · visible lines at rest</h2>
          <p className="mt-2 text-sm text-muted-foreground">{lineRes.summary}</p>
        </div>
        <div className="surface p-5">
          <p className="font-display text-xl text-foreground">Your facial-lines map</p>
          <div className="mx-auto mt-3 h-64 w-52"><FaceLines analysis={lineRes} active={activeLine} onTap={setActiveLine} /></div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">{(["forehead", "glabella", "eyes"] as const).map((area) =>
            <Button key={area} type="button" variant={activeLine === area ? "secondary" : "ghost"} onClick={() => setActiveLine(area)} className="h-auto min-h-10 whitespace-normal px-1.5 py-2 text-center text-xs leading-tight">{LINE_NAMES[area]}</Button>
          )}</div>
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground">{LINE_NAMES[activeLine]} · {LEVELS[lineRes[activeLine].level]}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{lineRes[activeLine].noticed}</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">Based on one relaxed photo. Lines during expression cannot be assessed here. For a full four-photo check, open Botox AI. This is educational information, not a treatment recommendation.</p>
        <Button type="button" variant="link" onClick={() => navigate({ to: "/botox" })} className="h-auto px-0 text-sm">Open Botox AI →</Button>
      </section>}
      {linePending && <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reading visible lines from your photo…</p>}
      {!redRes && !lineRes && !linePending && <p className="mt-2 text-sm text-muted-foreground">We couldn't read your photo this time — your baseline photo is still saved.</p>}
      <p className="eyebrow mt-8">🌹 Your starting skin profile</p>
      <div className="surface mt-4 divide-y divide-border">
        {profileSections(d).map((s) => <div key={s.label} className="p-4"><p className="eyebrow">{s.label}</p><ul className="mt-1.5 space-y-0.5">{s.items.map((x) => <li key={x} className="text-[15px] text-foreground">{x}</li>)}</ul></div>)}
        <div className="flex items-center gap-4 p-4">
          {photo && <img src={photo} alt="Your baseline photo" className="h-16 w-16 rounded-2xl object-cover" />}
          <div><p className="eyebrow">Baseline</p><p className="text-[15px] text-foreground">Day 1 · Created today</p></div>
        </div>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">{closingLine(d)}</p>
      <p className="mt-3 text-xs text-muted-foreground">Rose AI organizes what you record. It doesn't diagnose any condition or replace a qualified professional.</p>
      <div className="mt-6 flex flex-col gap-2">
         <Button type="button" onClick={() => navigate({ to: "/routine" })} className="h-auto w-full rounded-full gradient-rose py-4 text-sm text-primary-foreground">Build My Routine</Button>
         <Button type="button" variant="outline" onClick={() => navigate({ to: "/progress" })} className="h-auto w-full rounded-full py-3.5 text-sm">Start my skin timeline</Button>
         <Button type="button" variant="ghost" onClick={() => navigate({ to: "/profile" })} className="h-auto w-full rounded-full py-3.5 text-sm">Edit my profile</Button>
      </div>
    </div>;
  }

  const showNav = step !== "building" && step !== "signup" && step !== "profile" && step !== "gate";
  const progress = (i + 1) / steps.length;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col pb-6">
       {showNav && <div className="mb-6 flex items-center gap-3 pt-2">
         {i > 0 ? <button type="button" onClick={back} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground"><ArrowLeft className="h-4 w-4" /></button> : <div className="h-9 w-9" aria-hidden="true" />}
        <div className="flex-1"><ProgressBar value={progress} /></div>
      </div>}
      <RosieGuide step={step} />
      <div className="flex-1">{body}</div>
      {showNav && <button type="button" disabled={!valid} onClick={next}
        className="mt-8 rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40">{cta}</button>}
    </div>
  );
}
