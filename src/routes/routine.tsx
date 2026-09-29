import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { submitEmail } from "@/lib/experiment.functions";
import { track } from "@/lib/experiment";
import { useI18n } from "@/lib/i18n";
import {
  QUESTIONS, buildPlan, budgetTier, emptyAnswers, pickProducts, shopUrl, tierLabel,
  type Answers, type Plan, type Product, type Step,
} from "@/lib/routine/engine";

export const ROUTINE_KEY = "rose.routine.v1";

export const Route = createFileRoute("/routine")({
  head: () => ({
    meta: [
      { title: "Build My Routine — Rose AI" },
      { name: "description", content: "Answer 8 simple questions and get a personalized AM/PM skincare routine with one best product per step." },
      { property: "og:title", content: "Build My Routine — Rose AI" },
      { property: "og:description", content: "A personalized, gentle skincare routine for redness, dryness and sensitive skin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoutinePage,
});

export const DISCLAIMER = "Rose AI provides general skincare information and product recommendations. It does not diagnose rosacea or replace medical care. Prescription treatments and medical procedures should be discussed with a qualified healthcare professional.";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    supabase.from("products" as never).select("*").eq("active", true).then(({ data }) => setProducts((data ?? []) as unknown as Product[]));
  }, []);
  return products;
}

function RoutinePage() {
  const [a, setA] = useState<Answers>(emptyAnswers);
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const q = QUESTIONS[i]!;
  const val = a[q.key];
  const valid = q.optional || (Array.isArray(val) ? val.length > 0 : !!val);

  useEffect(() => { track("questionnaire_started", "routine"); }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [i, done]);

  function pick(o: string) {
    if (q.multi) {
      const cur = val as string[];
      const ex = q.exclusive ?? [];
      const next = cur.includes(o) ? cur.filter((x) => x !== o) : ex.includes(o) ? [o] : [...cur.filter((x) => !ex.includes(x)), o];
      setA({ ...a, [q.key]: next });
    } else setA({ ...a, [q.key]: o });
  }
  function next() {
    if (i < QUESTIONS.length - 1) return setI(i + 1);
    track("questionnaire_completed", "routine"); track("result_generated", "routine");
    setDone(true);
  }

  if (done) return <Results answers={a} onRestart={() => { setA(emptyAnswers); setI(0); setDone(false); }} />;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col pb-6">
      <div className="mb-6 flex items-center gap-3 pt-2">
        {i === 0 ? <Link to="/" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
          : <button type="button" onClick={() => setI(i - 1)} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground"><ArrowLeft className="h-4 w-4" /></button>}
        <div className="flex-1">
          <p className="eyebrow">Question {i + 1} of {QUESTIONS.length}</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full gradient-rose transition-all" style={{ width: `${((i + 1) / QUESTIONS.length) * 100}%` }} /></div>
        </div>
      </div>
      <h1 className="font-display text-3xl leading-tight text-foreground">{q.title}</h1>
      {q.hint && <p className="mt-2 text-sm text-muted-foreground">{q.hint}</p>}
      {q.optional && <p className="mt-1 text-xs text-muted-foreground">Optional</p>}
      <div className="mt-6 space-y-2.5">
        {q.options.map((o) => {
          const on = Array.isArray(val) ? val.includes(o) : val === o;
          return <button key={o} type="button" onClick={() => pick(o)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-[15px] transition ${on ? "border-primary bg-accent text-foreground" : "border-border bg-card text-foreground"}`}>
            {o}{on && <Check className="h-4 w-4 text-primary" />}
          </button>;
        })}
      </div>
      <button type="button" disabled={!valid} onClick={next} className="mt-8 rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground disabled:opacity-40">
        {i === QUESTIONS.length - 1 ? "See my routine" : q.optional && !val ? "Skip" : "Continue"}
      </button>
    </div>
  );
}

function Results({ answers, onRestart }: { answers: Answers; onRestart: () => void }) {
  const plan = useMemo(() => buildPlan(answers), [answers]);
  const products = useProducts();
  const budget = budgetTier(answers.budget);
  const [chosen, setChosen] = useState<Record<string, string>>({});

  if (plan.urgent) return <Urgent emergency={plan.urgent.emergency} onRestart={onRestart} />;

  const picks = (cat?: string) => (cat ? pickProducts(products, cat, plan.tags, budget) : undefined);
  const selected = (cat?: string) => { const p = picks(cat); if (!p?.best) return undefined; return [p.best, ...p.alts].find((x) => x.id === chosen[cat!]) ?? p.best; };
  const shopList = Array.from(new Map([...plan.am, ...plan.pm].filter((s) => s.category && !s.optional).map((s) => [s.category!, selected(s.category)])).values()).filter(Boolean) as Product[];

  function save() {
    localStorage.setItem(ROUTINE_KEY, JSON.stringify({ answers, chosen, savedAt: new Date().toISOString() }));
    track("routine_saved", "routine");
    toast.success("Saved to My Routine");
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pb-10">
      <PlanView plan={plan} products={products} budget={budget} chosen={chosen} setChosen={setChosen} />

      {shopList.length > 0 && <section className="surface p-5">
        <p className="eyebrow">Shop your routine</p>
        <ul className="mt-3 divide-y divide-border">{shopList.map((p) => <li key={p.id} className="flex items-center justify-between py-3">
          <div><p className="text-sm text-foreground">{p.brand} {p.name}</p><p className="text-xs text-muted-foreground">{p.approx_price ? `≈ $${p.approx_price}` : tierLabel(p.price_tier)}</p></div>
          <ShopButton p={p} />
        </li>)}</ul>
        <p className="mt-3 text-[0.7rem] text-muted-foreground">Some product links may be affiliate links. Rose AI may earn a commission if you make a purchase, at no additional cost to you.</p>
      </section>}

      <div className="flex flex-col gap-2">
        <button type="button" onClick={save} className="rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground">Save to My Routine</button>
        <EmailRoutine plan={plan} products={shopList} />
        <button type="button" onClick={onRestart} className="py-2 text-xs text-muted-foreground underline underline-offset-2">Start over</button>
      </div>
      <p className="text-[0.7rem] leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
    </div>
  );
}

export function PlanView({ plan, products, budget, chosen, setChosen }: { plan: Plan; products: Product[]; budget: number; chosen: Record<string, string>; setChosen: (c: Record<string, string>) => void }) {
  useEffect(() => { if (products.length) track("product_recommended", "routine"); }, [products.length]);
  return <>
    <header className="pt-2">
      <p className="eyebrow">Your Skin Plan</p>
      <h1 className="font-display text-4xl text-foreground">Today's priority</h1>
    </header>

    <section className={`surface-lift p-6 ${plan.rescue ? "border border-primary" : "gradient-dawn"}`}>
      <p className="font-display text-2xl tracking-wide text-primary">{plan.priority}</p>
      <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">{plan.priorityText}</p>
    </section>

    <section className="surface p-5">
      {[["Your skin today", plan.today.join(" + ") || "Comfortable"], ["Your priority", plan.priority], ["Your routine", plan.routineStyle], ["Your product matches", "$ / $$ / $$$"]].map(([k, v], n, arr) => (
        <div key={k} className="flex flex-col items-center text-center">
          <p className="eyebrow">{k}</p><p className="font-display text-lg text-foreground">{v}</p>
          {n < arr.length - 1 && <span className="my-1.5 h-4 w-px bg-border" />}
        </div>))}
    </section>

    {plan.rx && <section className="surface p-5">
      <p className="eyebrow">Medical treatment</p>
      <p className="mt-1 font-display text-lg text-foreground">{plan.rx}</p>
      <p className="mt-1 text-sm text-muted-foreground">Prescription rosacea treatments should be selected and used according to your healthcare professional's instructions. If a prescription causes significant irritation, contact the prescribing clinician.</p>
    </section>}

    <RoutineList title="Your morning routine" steps={plan.am} products={products} plan={plan} budget={budget} chosen={chosen} setChosen={setChosen} />
    <RoutineList title="Your evening routine" steps={plan.pm} products={products} plan={plan} budget={budget} chosen={chosen} setChosen={setChosen} />

    {plan.hydrateFirst && <section className="surface p-5"><p className="eyebrow">Add anti-aging step</p><p className="mt-1 text-sm text-muted-foreground">Once your skin feels comfortable for a few weeks, you can explore adding one gentle anti-aging product — see Advanced / Optional below.</p></section>}

    {plan.vessels && <section className="surface p-5">
      <p className="eyebrow">Explore professional options</p>
      <p className="mt-1 text-sm text-foreground">Skincare may help support sensitive skin and reduce the appearance of general redness, but established visible blood vessels may require professional treatment.</p>
      <p className="mt-2 text-sm text-muted-foreground">Options people discuss with professionals include pulsed dye laser (V-Beam) and IPL or other vascular light treatments. Only a qualified professional can say what's appropriate for you.</p>
    </section>}

    {plan.advanced.show && <section className="surface p-5">
      <p className="eyebrow">Advanced / Optional</p>
      <ul className="mt-2 space-y-1 text-sm text-foreground">{plan.advanced.items.map((x) => <li key={x}>• {x}</li>)}</ul>
      <p className="mt-2 text-xs text-muted-foreground">{plan.advanced.note} Never start retinoids while your skin is irritated.</p>
    </section>}
  </>;
}

function RoutineList({ title, steps, ...rest }: { title: string; steps: Step[]; products: Product[]; plan: Plan; budget: number; chosen: Record<string, string>; setChosen: (c: Record<string, string>) => void }) {
  return <section>
    <p className="eyebrow mb-3">{title}</p>
    <ol className="space-y-3">{steps.map((s, n) => <StepCard key={n + s.label} n={n + 1} step={s} {...rest} />)}</ol>
  </section>;
}

function StepCard({ n, step, products, plan, budget, chosen, setChosen }: { n: number; step: Step; products: Product[]; plan: Plan; budget: number; chosen: Record<string, string>; setChosen: (c: Record<string, string>) => void }) {
  const [open, setOpen] = useState<"why" | "alts" | null>(null);
  const p = step.category ? pickProducts(products, step.category, plan.tags, budget) : undefined;
  const all = p?.best ? [p.best, ...p.alts] : [];
  const cur = all.find((x) => x.id === chosen[step.category!]) ?? p?.best;
  return <li className="surface p-5">
    <div className="flex items-start gap-3">
      <span className="font-display text-xl text-primary">{String(n).padStart(2, "0")}</span>
      <div className="flex-1">
        <p className="text-[15px] font-medium text-foreground">{step.label}{step.optional && <span className="ml-2 text-xs font-normal text-muted-foreground">optional</span>}</p>
        {step.rx && <p className="mt-1 text-sm text-muted-foreground">{step.why}</p>}
        {cur && <div className="mt-3 rounded-2xl bg-accent/50 p-4">
          <p className="eyebrow">{cur.id === p?.best?.id ? "Best match" : "Your pick"}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{cur.brand}</p>
          <p className="font-display text-lg text-foreground">{cur.name} <span className="text-sm text-muted-foreground">{tierLabel(cur.price_tier)}</span></p>
          <p className="mt-1 text-xs text-muted-foreground">Best for: {cur.best_for}</p>
          <div className="mt-3"><ShopButton p={cur} label="View product" /></div>
        </div>}
        {!step.rx && <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setOpen(open === "why" ? null : "why")} className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground">Why this?</button>
          {all.length > 1 && <button type="button" onClick={() => { setOpen(open === "alts" ? null : "alts"); track("product_alternative_viewed", "routine"); }} className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground">Alternatives</button>}
        </div>}
        {open === "why" && <p className="mt-3 text-sm text-secondary-foreground">{step.why}{cur ? ` ${cur.brand} ${cur.name}: ${cur.purpose.toLowerCase()}${cur.fragrance_free ? ", fragrance-free" : ""}.` : ""}</p>}
        {open === "alts" && <div className="mt-3 space-y-2">
          <p className="eyebrow">Other good matches</p>
          {all.map((x) => <button key={x.id} type="button" onClick={() => setChosen({ ...chosen, [step.category!]: x.id })}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm ${x.id === cur?.id ? "border-primary" : "border-border"}`}>
            <span className="text-foreground">{x.brand} {x.name}</span>
            <span className="text-xs text-muted-foreground">{tierLabel(x.price_tier)} · {x.price_tier === 1 ? "Budget" : x.price_tier === 3 ? "Premium" : "Mid-range"}</span>
          </button>)}
        </div>}
        {p?.sponsored && <div className="mt-3 rounded-xl border border-dashed border-border p-3">
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Sponsored option</p>
          <p className="text-sm text-foreground">{p.sponsored.brand} {p.sponsored.name}</p>
          <div className="mt-2"><ShopButton p={p.sponsored} /></div>
        </div>}
      </div>
    </div>
  </li>;
}

function ShopButton({ p, label = "Shop" }: { p: Product; label?: string }) {
  const url = shopUrl(p);
  if (!url) return null;
  return <a href={url} target="_blank" rel="noopener noreferrer sponsored" onClick={() => track(p.affiliate_url ? "affiliate_clicked" : "shop_clicked", "routine")}
    className="inline-block rounded-full bg-card px-4 py-2 text-xs font-medium text-foreground shadow-sm">{label}</a>;
}

function EmailRoutine({ plan, products }: { plan: Plan; products: Product[] }) {
  const submit = useServerFn(submitEmail);
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const ok = z.string().trim().email().max(255).safeParse(email);
    if (!ok.success) return toast.error("Please enter a valid email address.");
    setBusy(true);
    const names = (steps: Step[]) => steps.map((s) => s.label).join(" → ");
    const res = await submit({ data: { email: ok.data, experience: "routine", lang: lang === "de" ? "de" : "en", results: {
      summary: `${plan.priority}: ${plan.priorityText}`.slice(0, 600),
      points: [`Morning: ${names(plan.am)}`, `Evening: ${names(plan.pm)}`, ...products.slice(0, 4).map((p) => `${p.brand} ${p.name}`)].map((x) => x.slice(0, 300)),
    } } }).catch(() => ({ ok: false }));
    setBusy(false);
    if (res.ok) { track("results_emailed", "routine"); toast.success("Your routine is on its way."); setOpen(false); }
    else toast.error("Something went wrong. Please try again.");
  }
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-border bg-card py-3.5 text-sm font-medium text-foreground">Email my routine</button>;
  return <form onSubmit={send} className="surface space-y-3 p-4">
    <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none focus:border-primary" />
    <button type="submit" disabled={busy} className="w-full rounded-full gradient-rose py-3.5 text-sm font-medium text-primary-foreground disabled:opacity-60">Send</button>
    <p className="text-[0.7rem] text-muted-foreground">We'll email your routine and occasional product updates. See our <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
  </form>;
}

function Urgent({ emergency, onRestart }: { emergency: boolean; onRestart: () => void }) {
  return <div className="mx-auto max-w-md space-y-5 pt-6">
    <div className="surface-lift border border-destructive p-6">
      <h1 className="font-display text-3xl text-foreground">{emergency ? "Please get urgent help" : "Please see a professional first"}</h1>
      <p className="mt-3 text-sm leading-relaxed text-foreground">{emergency
        ? "Difficulty breathing can be a sign of a serious reaction. Call your local emergency number or go to the nearest emergency department now."
        : "What you described — like severe swelling, eye symptoms, severe pain, signs of infection or a rapidly worsening reaction — should be checked by a doctor soon. We won't suggest a cosmetic routine until then."}</p>
    </div>
    <button type="button" onClick={onRestart} className="w-full py-2 text-xs text-muted-foreground underline">Start over</button>
    <p className="text-[0.7rem] text-muted-foreground">{DISCLAIMER}</p>
  </div>;
}
