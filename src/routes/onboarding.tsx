import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Plus } from "lucide-react";
import { Chip } from "@/components/Chip";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Get started — Rose AI" },
      { name: "description", content: "Set up your Rose AI skin timeline in a few short steps." },
      { property: "og:title", content: "Get started — Rose AI" },
      { property: "og:description", content: "Create your personal rosacea baseline with Rose AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

export const ONBOARDING_KEY = "rosea.onboarding.v1";

type Rating = "much_better" | "little_better" | "no_change" | "little_worse" | "much_worse" | "not_sure";
type TreatmentResult = { rating?: Rating; stillUsing?: boolean; stopReasons: string[] };

type Data = {
  goals: string[];
  goalOther: string;
  diagnosed: string;
  diagnosedAgo: string;
  symptoms: string[];
  symptomOther: string;
  redness: number;
  discomfort: number;
  tried: string[];
  triedOther: string;
  results: Record<string, TreatmentResult>;
  current: string[];
  influences: string[];
  influenceOther: string;
  confidence: string;
  tracking: string[];
  frequency: string;
  baselinePhoto?: string;
  baselineDate?: string;
  completedAt?: string;
};

const empty: Data = {
  goals: [], goalOther: "", diagnosed: "", diagnosedAgo: "", symptoms: [], symptomOther: "",
  redness: 0, discomfort: 0, tried: [], triedOther: "", results: {}, current: [],
  influences: [], influenceOther: "", confidence: "", tracking: [], frequency: "",
};

const GOALS = [
  "What might be associated with my flare-ups",
  "Whether my skin is getting better or worse",
  "Whether my current routine/treatment seems to be helping",
  "How my skin changes over time",
  "Keep a history to discuss with my dermatologist",
  "Something else",
];
const DIAG = ["Yes, by a dermatologist", "Yes, by another healthcare professional", "No", "I'm not sure"];
const AGO = ["Less than 1 year", "1–3 years", "3–5 years", "5+ years"];
const SYMPTOMS = [
  "Persistent facial redness", "Flushing that comes and goes", "Visible blood vessels", "Bumps or pimples",
  "Burning or stinging", "Dryness / tightness", "Itching", "Swelling", "Eye irritation / dryness",
  "Thickening of the skin", "Something else",
];
const TREATMENTS: { group: string; items: string[] }[] = [
  { group: "Prescription treatments", items: ["Ivermectin / Soolantra", "Azelaic acid / Finacea", "Metronidazole / MetroGel", "Doxycycline", "Minocycline", "Brimonidine / Mirvaso", "Oxymetazoline / Rhofade", "Other prescription treatment", "I don't remember the name"] },
  { group: "Laser / light / procedures", items: ["IPL", "VBeam / pulsed-dye laser (PDL)", "KTP laser", "Other laser/light treatment", "Other procedure"] },
  { group: "Skincare / lifestyle", items: ["Moisturizer / barrier-supporting skincare", "Gentle cleanser", "Sunscreen / SPF", "Avoiding suspected triggers", "Diet changes"] },
];
const NONE_TRIED = "I haven't tried anything yet";
const RATINGS: [Rating, string][] = [
  ["much_better", "Much better"], ["little_better", "A little better"], ["no_change", "No noticeable change"],
  ["little_worse", "A little worse"], ["much_worse", "Much worse"], ["not_sure", "Not sure"],
];
const STOP = ["Didn't help", "Made my skin worse", "Side effects / irritation", "Too expensive", "Doctor recommended stopping", "Finished treatment", "Other"];
const INFLUENCES = [
  "Sun", "Hot weather", "Cold weather", "Temperature changes", "Stress", "Exercise", "Alcohol", "Spicy food",
  "Hot drinks", "Certain foods", "Skincare products", "Poor sleep", "Menstrual/hormonal changes", "Medication",
  "Travel", "I'm not sure yet", "Something else",
];
const CONFIDENCE = ["I have no idea", "I have some suspicions", "I know a few patterns", "I'm fairly confident about my triggers"];
const TRACKING = ["Photos", "Notes", "Journal", "Spreadsheet", "Another app", "I rely on memory", "I don't track it"];
const FREQ = ["Every day", "A few times per week", "Once per week", "Only during a flare-up", "Only when something changes", "I'm not sure yet"];

const short = (s: string) => s.split(" / ").pop()!.replace(/ \(.*\)/, "");

function toggle(list: string[], v: string, max?: number) {
  if (list.includes(v)) return list.filter((x) => x !== v);
  if (max && list.length >= max) return list;
  return [...list, v];
}

function Option({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-all active:scale-[0.99] ${
        selected ? "border-primary/40 bg-accent text-accent-foreground" : "border-border bg-card text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function Scale({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-2 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-11 flex-1 rounded-xl border text-sm ${value === n ? "border-primary/40 bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground"}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[0.7rem] text-muted-foreground"><span>None</span><span>Severe</span></div>
    </div>
  );
}

const Other = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder="Tell us more…"
    className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50"
  />
);

function Onboarding() {
  const navigate = useNavigate();
  const [d, setD] = useState<Data>(empty);
  const [step, setStep] = useState(0);
  const [added, setAdded] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (p: Partial<Data>) => setD((x) => ({ ...x, ...p }));

  const triedReal = d.tried.filter((t) => t !== NONE_TRIED && t !== "Other");

  const steps: { section: string; title: string; hint?: string; valid: boolean; body: React.ReactNode }[] = [
    {
      section: "Your goals", title: "What would you like Rose AI to help you understand?", hint: "Choose up to 2.",
      valid: d.goals.length > 0,
      body: <div className="space-y-2">{GOALS.map((g) => <Option key={g} label={g} selected={d.goals.includes(g)} onClick={() => set({ goals: toggle(d.goals, g, 2) })} />)}{d.goals.includes("Something else") && <Other value={d.goalOther} onChange={(v) => set({ goalOther: v })} />}</div>,
    },
    {
      section: "About you", title: "Have you been diagnosed with rosacea?",
      valid: !!d.diagnosed && (!d.diagnosed.startsWith("Yes") || !!d.diagnosedAgo),
      body: <div className="space-y-2">{DIAG.map((o) => <Option key={o} label={o} selected={d.diagnosed === o} onClick={() => set({ diagnosed: o })} />)}
        {d.diagnosed.startsWith("Yes") && <div className="pt-4"><p className="mb-2 text-sm font-medium text-foreground">How long ago were you diagnosed?</p><div className="flex flex-wrap gap-2">{AGO.map((o) => <Chip key={o} label={o} selected={d.diagnosedAgo === o} onClick={() => set({ diagnosedAgo: o })} />)}</div></div>}</div>,
    },
    {
      section: "About you", title: "What do you currently experience?", hint: "Select all that apply.",
      valid: d.symptoms.length > 0,
      body: <div><div className="flex flex-wrap gap-2">{SYMPTOMS.map((s) => <Chip key={s} label={s} selected={d.symptoms.includes(s)} onClick={() => set({ symptoms: toggle(d.symptoms, s) })} />)}</div>{d.symptoms.includes("Something else") && <Other value={d.symptomOther} onChange={(v) => set({ symptomOther: v })} />}</div>,
    },
    {
      section: "About you", title: "How would you describe your skin today?", hint: "This becomes your self-reported baseline.",
      valid: d.redness > 0 && d.discomfort > 0,
      body: <div className="space-y-6"><Scale label="Redness" value={d.redness} onChange={(n) => set({ redness: n })} /><Scale label="Discomfort" value={d.discomfort} onChange={(n) => set({ discomfort: n })} /></div>,
    },
    {
      section: "Your history", title: "What have you tried for your rosacea or redness?", hint: "Select everything you've tried.",
      valid: d.tried.length > 0,
      body: <div className="space-y-5">{TREATMENTS.map((g) => <div key={g.group}><p className="eyebrow mb-2">{g.group}</p><div className="flex flex-wrap gap-2">{g.items.map((i) => <Chip key={i} label={i} selected={d.tried.includes(i)} onClick={() => set({ tried: toggle(d.tried.filter((x) => x !== NONE_TRIED), i) })} />)}</div></div>)}
        <div className="flex flex-wrap gap-2"><Chip label="Other" selected={d.tried.includes("Other")} onClick={() => set({ tried: toggle(d.tried.filter((x) => x !== NONE_TRIED), "Other") })} /><Chip label={NONE_TRIED} selected={d.tried.includes(NONE_TRIED)} onClick={() => set({ tried: d.tried.includes(NONE_TRIED) ? [] : [NONE_TRIED] })} /></div>
        {d.tried.includes("Other") && <Other value={d.triedOther} onChange={(v) => set({ triedOther: v })} />}</div>,
    },
    {
      section: "Your history", title: "How did each treatment work for you?",
      valid: true,
      body: triedReal.length === 0 ? <p className="text-sm text-muted-foreground">Nothing to rate — tap Continue.</p> : <div className="space-y-4">{triedReal.map((t) => {
        const r = d.results[t] ?? { stopReasons: [] };
        const up = (p: Partial<TreatmentResult>) => set({ results: { ...d.results, [t]: { ...r, ...p } } });
        return <div key={t} className="surface space-y-3 p-4">
          <p className="font-display text-xl text-foreground">{t}</p>
          <p className="text-xs text-muted-foreground">How did your skin change while you were using it?</p>
          <div className="flex flex-wrap gap-2">{RATINGS.map(([k, l]) => <Chip key={k} label={l} selected={r.rating === k} onClick={() => up({ rating: k })} />)}</div>
          <p className="text-xs text-muted-foreground">Are you still using it?</p>
          <div className="flex gap-2"><Chip label="Yes" selected={r.stillUsing === true} onClick={() => up({ stillUsing: true })} /><Chip label="No" selected={r.stillUsing === false} onClick={() => up({ stillUsing: false })} /></div>
          {r.stillUsing === false && <><p className="text-xs text-muted-foreground">Why did you stop?</p><div className="flex flex-wrap gap-2">{STOP.map((s) => <Chip key={s} label={s} selected={r.stopReasons.includes(s)} onClick={() => up({ stopReasons: toggle(r.stopReasons, s) })} />)}</div></>}
        </div>;
      })}</div>,
    },
    {
      section: "Your history", title: "What are you currently using?", hint: "This becomes your Day 1 routine baseline.",
      valid: true,
      body: <div className="space-y-3"><div className="flex flex-wrap gap-2">{[...new Set([...triedReal, ...d.current])].map((t) => <Chip key={t} label={short(t)} selected={d.current.includes(t)} onClick={() => set({ current: toggle(d.current, t) })} />)}</div>
        <div className="flex gap-2"><input value={added} onChange={(e) => setAdded(e.target.value)} placeholder="Add another" className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none" />
          <button type="button" onClick={() => { if (added.trim()) { set({ current: [...d.current, added.trim()] }); setAdded(""); } }} className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-rose text-primary-foreground"><Plus className="h-5 w-5" /></button></div></div>,
    },
    {
      section: "Possible influences", title: "What seems to affect your skin?", hint: "Select anything you've noticed — these aren't confirmed triggers.",
      valid: d.influences.length > 0,
      body: <div><div className="flex flex-wrap gap-2">{INFLUENCES.map((s) => <Chip key={s} label={s} selected={d.influences.includes(s)} onClick={() => set({ influences: toggle(d.influences, s) })} />)}</div>{d.influences.includes("Something else") && <Other value={d.influenceOther} onChange={(v) => set({ influenceOther: v })} />}</div>,
    },
    {
      section: "Possible influences", title: "How confident are you about what affects your skin?",
      valid: !!d.confidence,
      body: <div className="space-y-2">{CONFIDENCE.map((o) => <Option key={o} label={o} selected={d.confidence === o} onClick={() => set({ confidence: o })} />)}</div>,
    },
    {
      section: "How you track today", title: "How do you currently track changes in your skin?", hint: "Select all that apply.",
      valid: d.tracking.length > 0,
      body: <div className="flex flex-wrap gap-2">{TRACKING.map((s) => <Chip key={s} label={s} selected={d.tracking.includes(s)} onClick={() => set({ tracking: toggle(d.tracking, s) })} />)}</div>,
    },
    {
      section: "How you track today", title: "How often would you realistically check in?",
      valid: !!d.frequency,
      body: <div className="space-y-2">{FREQ.map((o) => <Option key={o} label={o} selected={d.frequency === o} onClick={() => set({ frequency: o })} />)}</div>,
    },
    {
      section: "Your baseline photo", title: "Let's create your baseline.", hint: "We'll use this so you can compare your skin with yourself over time.",
      valid: true,
      body: <div className="space-y-4">
        <div className="mx-auto flex aspect-[3/4] w-56 items-center justify-center overflow-hidden rounded-[50%] border-2 border-dashed border-primary/40 bg-accent/40">
          {d.baselinePhoto ? <img src={d.baselinePhoto} alt="Baseline" className="h-full w-full object-cover" /> : <Camera className="h-10 w-10 text-primary/60" strokeWidth={1.4} />}
        </div>
        <p className="text-center text-xs text-muted-foreground">Natural light · No filter · Face forward · Similar distance</p>
        <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const r = new FileReader(); r.onload = () => set({ baselinePhoto: String(r.result), baselineDate: new Date().toISOString() }); r.readAsDataURL(f);
        }} />
        <button type="button" onClick={() => fileRef.current?.click()} className="w-full rounded-full border border-primary/40 bg-card py-3 text-sm text-primary">{d.baselinePhoto ? "Retake baseline photo" : "Take baseline photo"}</button>
        <p className="surface p-4 text-xs leading-relaxed text-muted-foreground">Your baseline photo stays on this device only — it isn't uploaded or shared. It's kept until you delete it, which you can do anytime in Profile → Privacy. You can also skip this and add one later.</p>
      </div>,
    },
  ];

  const finish = () => {
    const final = { ...d, baselineDate: d.baselineDate ?? new Date().toISOString(), completedAt: new Date().toISOString() };
    try { localStorage.setItem(ONBOARDING_KEY, JSON.stringify(final)); }
    catch { localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ ...final, baselinePhoto: undefined })); }
    navigate({ to: "/" });
  };

  if (step === steps.length) {
    const rows: [string, string][] = [
      ["Your goals", d.goals.map((g) => (g === "Something else" ? d.goalOther || g : g)).join(" + ")],
      ["Currently using", d.current.map(short).join(" · ") || "Nothing yet"],
      ["Possible influences", d.influences.filter((i) => i !== "Something else").join(" · ") || "Not sure yet"],
      ["Baseline", new Date(d.baselineDate ?? Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric" })],
    ];
    return (
      <div className="animate-rise space-y-6">
        <p className="font-display text-3xl text-primary">Finished 🌹</p>
        <h1 className="text-[2rem] leading-tight text-foreground">Your Rose AI timeline starts today.</h1>
        <div className="surface divide-y divide-border/70">
          {rows.map(([k, v]) => <div key={k} className="p-4"><p className="eyebrow">{k}</p><p className="mt-1 text-sm text-foreground">{v}</p></div>)}
        </div>
        <p className="text-sm text-secondary-foreground">Rose AI will help you organize your observations and compare changes over time.</p>
        <button type="button" onClick={finish} className="flex w-full items-center justify-center gap-2 rounded-full gradient-rose py-4 text-primary-foreground">Start my timeline <ArrowRight className="h-4 w-4" /></button>
        <p className="text-[0.7rem] leading-relaxed text-muted-foreground">Rose AI helps you track and organize information about your skin. It does not diagnose rosacea, identify the medical cause of symptoms, or replace advice from a qualified healthcare professional.</p>
      </div>
    );
  }

  const s = steps[step]!;
  return (
    <div className="animate-rise space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Back" onClick={() => setStep(Math.max(0, step - 1))} className={`text-muted-foreground ${step === 0 ? "invisible" : ""}`}><ArrowLeft className="h-5 w-5" /></button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full gradient-rose transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        <span className="text-xs text-muted-foreground">{step + 1}/{steps.length}</span>
      </div>
      <div>
        <p className="eyebrow">{s.section}</p>
        <h1 className="mt-2 text-[1.75rem] leading-tight text-foreground">{s.title}</h1>
        {s.hint && <p className="mt-1 text-sm text-muted-foreground">{s.hint}</p>}
      </div>
      {s.body}
      <button type="button" disabled={!s.valid} onClick={() => setStep(step + 1)} className="w-full rounded-full gradient-rose py-4 text-primary-foreground disabled:opacity-40">
        {step === steps.length - 1 && !d.baselinePhoto ? "Skip for now" : "Continue"}
      </button>
    </div>
  );
}
