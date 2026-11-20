import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight, Camera, ChevronDown, FlaskConical, HeartHandshake, Layers,
  LineChart, Menu, Microscope, NotebookPen, ScanFace, ShieldCheck, Sparkles, Sprout, X,
} from "lucide-react";
import portrait from "@/assets/mary-portrait.jpg.asset.json";

const APP_URL = "https://xrosacea.com";
const serif = "font-['Cormorant_Garamond',serif]";

const TITLE = "Rosea.AI — AI skincare companion for rosacea & sensitive skin";
const DESC =
  "Explore rosacea-friendly skincare, check ingredients and track your skin's changes over time with Rosea.AI, an AI companion for sensitive skin. Not a diagnostic tool.";

export const Route = createFileRoute("/site")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "keywords", content: "rosacea skincare, sensitive skin skincare, skincare ingredient checker, AI skincare analysis, rosacea skin tracker, personalized skincare recommendations" },
    ],
  }),
  component: SitePage,
});

const NAV = [
  ["How It Works", "#how"],
  ["Features", "#features"],
  ["Our Story", "#story"],
  ["FAQ", "#faq"],
] as const;

function Cta({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <a href={APP_URL} className={`inline-flex items-center justify-center gap-2 rounded-full bg-site-cta px-6 py-3 text-sm font-semibold text-site-ivory shadow-[0_10px_30px_-12px_var(--site-cta)] transition hover:brightness-110 ${className}`}>
      {children}
    </a>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.22em] text-site-rose">{children}</p>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className={`${serif} text-4xl font-semibold leading-tight text-site-slate md:text-5xl`}>{children}</h2>;
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-site-slate/10 bg-site-ivory/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <a href="#top" className={`${serif} text-2xl font-semibold text-site-slate`}>Rosea<span className="text-site-rose">.AI</span></a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV.map(([l, h]) => <a key={h} href={h} className="text-sm font-medium text-site-slate/80 hover:text-site-slate">{l}</a>)}
          <Cta className="px-5 py-2">Try for Free</Cta>
        </nav>
        <button className="md:hidden text-site-slate" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-site-slate/10 bg-site-ivory px-5 pb-5 md:hidden" aria-label="Mobile">
          {NAV.map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)} className="block py-3 text-base font-medium text-site-slate">{l}</a>)}
          <Cta className="mt-3 w-full">Try for Free</Cta>
        </nav>
      )}
    </header>
  );
}

function Phone({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-[260px] rounded-[2.4rem] border-[10px] border-site-slate bg-site-ivory p-4 shadow-[0_30px_60px_-25px_var(--site-slate)] ${className}`}>
      <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-site-slate/20" />
      {children}
    </div>
  );
}

function AnalysisMockup() {
  return (
    <Phone>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-site-blue">Today's skin check</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative grid h-20 w-20 place-items-center rounded-full" style={{ background: "conic-gradient(var(--site-blue) 0 72%, var(--site-paleblue) 72% 100%)" }}>
          <div className="grid h-16 w-16 place-items-center rounded-full bg-site-ivory">
            <span className={`${serif} text-2xl font-semibold text-site-slate`}>72</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-site-slate">Calmer than last week</p>
          <p className="text-[11px] text-site-ink/70">Photo-based observation</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {[["Visible redness", "Mild · cheeks", "bg-site-rose"], ["Dryness", "Low", "bg-site-blue"], ["Routine", "On track", "bg-site-sage"]].map(([a, b, c]) => (
          <div key={a} className="flex items-center justify-between rounded-xl bg-site-paleblue/70 px-3 py-2">
            <span className="flex items-center gap-2 text-xs font-medium text-site-slate"><span className={`h-2 w-2 rounded-full ${c}`} />{a}</span>
            <span className="text-[11px] text-site-ink/70">{b}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-site-sage/40 bg-site-ivory p-3">
        <p className="text-[11px] font-semibold text-site-sage">Gentle tip</p>
        <p className="text-[11px] text-site-ink/80">A fragrance-free moisturizer may feel soothing today.</p>
      </div>
    </Phone>
  );
}

function TrackingMockup() {
  const pts = [62, 58, 66, 55, 48, 44, 40];
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"}${i * 36 + 6},${v}`).join(" ");
  return (
    <Phone>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-site-blue">Progress · 6 weeks</p>
      <svg viewBox="0 0 230 80" className="mt-2 w-full" role="img" aria-label="Redness trend chart going down over six weeks">
        {[20, 40, 60].map((y) => <line key={y} x1="0" x2="230" y1={y} y2={y} stroke="var(--site-paleblue)" />)}
        <path d={path} fill="none" stroke="var(--site-blue)" strokeWidth="2.5" strokeLinecap="round" />
        {pts.map((v, i) => <circle key={i} cx={i * 36 + 6} cy={v} r="3" fill="var(--site-slate)" />)}
      </svg>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {["Week 1", "Week 6"].map((w, i) => (
          <div key={w} className="rounded-xl p-2" style={{ background: i ? "var(--site-paleblue)" : "var(--site-blush)" }}>
            <div className="h-14 rounded-lg bg-site-ivory/70 grid place-items-center"><Camera className="h-4 w-4 text-site-slate/50" /></div>
            <p className="mt-1 text-center text-[10px] font-medium text-site-slate">{w}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-site-sage">Trigger journal</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {["Hot coffee", "Sun", "Stress", "New serum"].map((t) => <span key={t} className="rounded-full bg-site-sage/15 px-2 py-0.5 text-[10px] text-site-slate">{t}</span>)}
      </div>
      <div className="mt-3 flex justify-between text-[10px] text-site-ink/70"><span>Burning: low</span><span>Flushing: 2×</span></div>
    </Phone>
  );
}

const FAQS: [string, string][] = [
  ["What is Rosea.AI?", "Rosea.AI is a skincare companion app for rosacea-prone and sensitive skin. It offers photo-based skin observations, product and ingredient exploration, and tools to track symptoms, routines and possible triggers over time."],
  ["Is Rosea.AI suitable for sensitive skin?", "It was designed with sensitive and rosacea-prone skin in mind — for example, it favours fragrance-free options and flags commonly irritating ingredients. Everyone's skin is different, so always patch-test new products."],
  ["Can Rosea.AI diagnose rosacea?", "No. Rosea.AI is not a medical device and does not diagnose, treat or replace a dermatologist. Its observations are informational. If you're worried about your skin, please see a healthcare professional."],
  ["How does ingredient analysis work?", "Rosea.AI compares product information against ingredients often discussed as potential irritants for sensitive skin and your stated preferences. Some product details are imported and not yet checked, and these are labelled. It cannot guarantee that a product will be safe or effective for you."],
  ["Can I track my skin over time?", "Yes. You can repeat skin checks, compare progress, and log symptoms, routines and possible triggers to spot patterns."],
  ["Is Rosea.AI free?", "You can start for free, including a skin check preview. An optional paid plan, Rosea.AI Pro, unlocks full analysis results. [Pricing details to be confirmed on the pricing page.]"],
  ["How are my photos and personal information handled?", "By default, skin-check photos are analysed and not kept on our servers. Photos are stored only if you explicitly opt in, and you can delete them. See our privacy policy for full details. [Final privacy wording to be confirmed.]"],
];

function SitePage() {
  return (
    <div id="top" className="min-h-screen scroll-smooth bg-site-ivory text-site-ink">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-site-blush">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-site-paleblue blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-site-ivory blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
            <div>
              <Eyebrow>Rosea.AI — Your personal skin companion</Eyebrow>
              <h1 className={`${serif} mt-5 text-5xl font-semibold leading-[1.05] text-site-slate md:text-6xl`}>Your skin is unique. Your skincare should be too.</h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-site-ink/80">Discover skincare products, explore ingredients, and track your skin's changes with an AI-powered companion designed for rosacea-prone and sensitive skin.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta>Try Rosea.AI for Free <ArrowRight className="h-4 w-4" /></Cta>
                <a href="#how" className="inline-flex items-center rounded-full border border-site-slate/25 px-6 py-3 text-sm font-semibold text-site-slate hover:bg-site-ivory/60">See How It Works</a>
              </div>
              <p className="mt-6 text-sm italic text-site-slate/70">Understand your skin. Less guessing, better skincare.</p>
            </div>
            <div className="relative">
              <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-site-blue/30" />
              <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-site-blue/40" />
              <AnalysisMockup />
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="max-w-2xl">
            <H2>Sensitive skin shouldn't mean endless guesswork.</H2>
            <p className="mt-5 text-lg text-site-ink/75">Finding skincare that works for rosacea-prone skin can feel overwhelming. With so many products, ingredients, and possible triggers, understanding your skin is not always easy.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[[Layers, "Too many skincare products", "Shelves full of promises, and no clear way to know what suits reactive skin.", "border-t-site-rose"],
              [FlaskConical, "Confusing ingredient lists", "Long INCI lists make it hard to spot what might irritate.", "border-t-site-blue"],
              [Sprout, "Unpredictable skin changes", "Flare-ups come and go, and patterns are hard to remember.", "border-t-site-sage"]].map(([Icon, t, d, c]) => {
              const I = Icon as typeof Layers;
              return (
                <article key={t as string} className={`rounded-3xl border border-site-slate/10 border-t-4 ${c} bg-site-ivory p-7 shadow-sm`}>
                  <I className="h-6 w-6 text-site-slate" strokeWidth={1.5} />
                  <h3 className={`${serif} mt-4 text-2xl font-semibold text-site-slate`}>{t as string}</h3>
                  <p className="mt-2 text-site-ink/70">{d as string}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* How */}
        <section id="how" className="scroll-mt-20 border-y border-site-slate/10 bg-site-ivory py-20">
          <div className="mx-auto max-w-6xl px-5">
            <Eyebrow>How it works</Eyebrow>
            <div className="mt-3"><H2>A smarter way to understand your skin.</H2></div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[[ScanFace, "01", "Explore Your Skin", "Use AI-powered tools to explore visible skin characteristics and build awareness of changes over time."],
                [Sparkles, "02", "Discover Your Skincare", "Explore personalized product suggestions and ingredient information to make more informed skincare decisions."],
                [LineChart, "03", "Track Your Progress", "Save photos, monitor symptoms, and record possible triggers to recognize patterns over time."]].map(([Icon, n, t, d], i) => {
                const I = Icon as typeof ScanFace;
                return (
                  <article key={n as string} className={`rounded-3xl border border-site-slate/10 p-8 ${i % 2 ? "bg-site-paleblue" : "bg-site-blush/40"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`${serif} text-5xl font-semibold text-site-rose/70`}>{n as string}</span>
                      <I className="h-6 w-6 text-site-blue" strokeWidth={1.5} />
                    </div>
                    <h3 className={`${serif} mt-6 text-2xl font-semibold text-site-slate`}>{t as string}</h3>
                    <p className="mt-2 text-site-ink/75">{d as string}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Discovery */}
        <section id="features" className="relative scroll-mt-20 overflow-hidden bg-site-paleblue py-20">
          <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-40" aria-hidden="true">
            <defs><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="var(--site-blue)" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <div className="relative mx-auto max-w-6xl px-5">
            <Eyebrow>AI-powered discovery</Eyebrow>
            <div className="mt-3 max-w-2xl"><H2>Skincare decisions, backed by better information.</H2></div>
            <p className="mt-5 max-w-2xl text-lg text-site-ink/75">Explore products and ingredients with your skin's sensitivities and preferences in mind.</p>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[[Microscope, "Ingredient analysis", "See which ingredients are commonly discussed as potential irritants."],
                [Sparkles, "Personalized product discovery", "Browse products filtered by your goals and preferences."],
                [ShieldCheck, "Sensitive-skin considerations", "Fragrance-free and gentle options are highlighted first."],
                [Sprout, "Skincare routine support", "Build a simple morning and evening routine step by step."]].map(([Icon, t, d]) => {
                const I = Icon as typeof Microscope;
                return (
                  <article key={t as string} className="rounded-3xl border border-site-blue/30 bg-site-ivory/90 p-6">
                    <I className="h-6 w-6 text-site-blue" strokeWidth={1.5} />
                    <h3 className="mt-4 font-semibold text-site-slate">{t as string}</h3>
                    <p className="mt-2 text-sm text-site-ink/70">{d as string}</p>
                  </article>
                );
              })}
            </div>
            <p className="mt-8 text-sm text-site-slate/70">Suggestions are informational. No tool can guarantee a product will be safe or effective for your skin — patch-test new products.</p>
          </div>
        </section>

        {/* Tracking */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
          <div className="order-2 md:order-1"><TrackingMockup /></div>
          <div className="order-1 md:order-2">
            <Eyebrow>Progress tracking</Eyebrow>
            <div className="mt-3"><H2>Your skin changes. Now you can follow the journey.</H2></div>
            <p className="mt-5 text-lg text-site-ink/75">Keep your skin photos, symptoms, and routines organized in one place. Compare changes over time and explore possible connections between your daily habits and your skin.</p>
            <ul className="mt-6 space-y-3">
              {[[LineChart, "Skin progress timeline", "text-site-blue"], [Camera, "Photo comparisons", "text-site-blue"], [HeartHandshake, "Symptom tracking", "text-site-rose"], [NotebookPen, "Possible trigger journal", "text-site-sage"]].map(([Icon, t, c]) => {
                const I = Icon as typeof LineChart;
                return <li key={t as string} className="flex items-center gap-3 font-medium text-site-slate"><I className={`h-5 w-5 ${c}`} strokeWidth={1.5} />{t as string}</li>;
              })}
            </ul>
          </div>
        </section>

        {/* Founder */}
        <section id="story" className="scroll-mt-20 bg-site-ivory py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-[45fr_55fr] md:gap-16">
            <div className="relative">
              <div className="absolute -left-4 -top-4 h-2/3 w-2/3 rounded-[2rem] bg-site-paleblue" aria-hidden="true" />
              <figure className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-site-blush">
                <img src={portrait.url} alt="Mary, founder of Rosea.AI" className="absolute inset-0 h-full w-full object-cover object-top" />
              </figure>
            </div>
            <div className="text-left">
              <Eyebrow>Meet our founder</Eyebrow>
              <h2 className={`${serif} mt-4 text-4xl font-semibold leading-tight text-site-slate md:text-[3.25rem]`}>Born From Experience. Built With Purpose.</h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-site-slate md:text-lg">
                <p>After years of living with rosacea, Mary founded Rosea.AI to make understanding sensitive skin and finding suitable skincare less overwhelming.</p>
                <p>Drawing on her personal journey, background in psychology, and passion for evidence-informed skincare, she's building the tool she wishes she'd had years ago — with the belief that everyone deserves to feel more confident in their own skin.</p>
              </div>
              <span className="mt-8 block h-px w-16 bg-site-rose" aria-hidden="true" />
              <p className={`${serif} mt-5 text-2xl font-semibold text-site-slate`}>Mary</p>
              <p className="text-sm text-site-slate/70">Founder &amp; CEO, Rosea.AI</p>
              <Link to="/our-story" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-site-slate underline decoration-site-rose underline-offset-4 hover:text-site-cta">Read My Story <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>

        {/* Science */}
        <section className="bg-gradient-to-b from-site-ivory to-site-paleblue py-20">
          <div className="mx-auto max-w-6xl px-5 text-center">
            <H2>Science-led. Skin-centered.</H2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-site-ink/75">We believe skincare should be informed by evidence, personalized to individual needs, and approached with compassion.</p>
            <div className="mt-12 grid gap-5 text-left md:grid-cols-3">
              {[["Evidence-informed education", "Content draws on published skincare guidance, explained in plain language."],
                ["Transparent AI technology", "We explain what the AI observes and where its limits are."],
                ["Individual skin differences", "What works for one person may not work for another — and that's expected."]].map(([t, d]) => (
                <article key={t} className="rounded-3xl border border-site-slate/10 bg-site-ivory p-7">
                  <span className="block h-px w-10 bg-site-blue" />
                  <h3 className={`${serif} mt-5 text-2xl font-semibold text-site-slate`}>{t}</h3>
                  <p className="mt-2 text-site-ink/70">{d}</p>
                </article>
              ))}
            </div>
            <p className="mx-auto mt-10 max-w-2xl rounded-2xl border border-site-slate/15 bg-site-ivory/80 px-5 py-4 text-sm text-site-slate">
              Rosea.AI is not a medical diagnostic tool and does not replace professional dermatology care.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-20">
          <div className="text-center"><H2>Frequently asked questions</H2></div>
          <div className="mt-10 divide-y divide-site-slate/10 rounded-3xl border border-site-slate/10 bg-site-ivory">
            {FAQS.map(([q, a]) => (
              <details key={q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-site-slate">
                  {q}<ChevronDown className="h-5 w-5 shrink-0 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 leading-relaxed text-site-ink/75">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 pb-20">
          <div className="mx-auto max-w-5xl rounded-[2.5rem] bg-gradient-to-br from-site-rose to-site-blush px-6 py-16 text-center">
            <h2 className={`${serif} text-4xl font-semibold text-site-slate md:text-5xl`}>Your skin journey deserves more clarity.</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-site-slate/85">Start understanding your skin, exploring skincare, and tracking your progress with Rosea.AI.</p>
            <Cta className="mt-8">Start for Free <ArrowRight className="h-4 w-4" /></Cta>
            <p className="mt-4 text-sm text-site-slate/75">Your personal skincare companion.</p>
          </div>
        </section>
      </main>
      <footer className="border-t border-site-slate/10 px-5 py-8 text-center text-sm text-site-slate/70">
        © {new Date().getFullYear()} Rosea.AI · <a href={`${APP_URL}/privacy`} className="underline">Privacy</a> · Not a medical device.
      </footer>
    </div>
  );
}
