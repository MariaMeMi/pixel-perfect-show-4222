import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track, type Experience } from "@/lib/experiment";
import { PRO_FEATURES, PRO_PRICES, perMonth, pricingGroup, renewalTerms, type Interval, type PricingGroup } from "@/lib/pro/pricing";

/** Monthly / yearly picker with renewal terms. Identical design for both price groups. */
export function PlanPicker({ group, interval, onChange }: { group: PricingGroup; interval: Interval; onChange: (i: Interval) => void }) {
  const p = PRO_PRICES[group];
  const option = (id: Interval, title: string, price: string, note: string, badge?: string) => (
    <button type="button" onClick={() => onChange(id)} aria-pressed={interval === id}
      className={`relative flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition-colors ${interval === id ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-border/60 bg-card"}`}>
      <span className="flex items-center gap-3">
      <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${interval === id ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>{interval === id && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}</span>
      <span>
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{note}</span>
      </span>
      </span>
      <span className="text-right font-display text-xl text-foreground">{price}</span>
      {badge && <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">{badge}</span>}
    </button>
  );
  return (
    <div className="space-y-3">
      {option("monthly", "Monthly", p.monthly.label, `Billed monthly · renews at ${p.monthly.label}/month`)}
      {option("yearly", "Yearly", p.yearly.label, `Billed yearly · about ${perMonth(p.yearly.cents)}/mo`, "Best value")}
      <p className="pt-1 text-xs leading-relaxed text-muted-foreground">{renewalTerms(interval, p[interval].label)}</p>
    </div>
  );
}

export function ProFeatures() {
  return (
    <ul className="mt-3 space-y-2">{PRO_FEATURES.map((f) => (
      <li key={f} className="flex gap-2 text-sm text-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>))}</ul>
  );
}

/** Shown after a skin analysis for English users without Pro: a brief free preview, then the subscription offer. */
export function ProOffer({ experience, preview, back }: {
  experience: Experience;
  preview: { score?: number | undefined; summary?: string | undefined; point?: string | undefined };
  back: "/onboarding" | "/results";
}) {
  const navigate = useNavigate();
  const [group] = useState<PricingGroup>(() => pricingGroup());
  const [interval, setInterval] = useState<Interval>("yearly");
  const seen = useRef(false);
  useEffect(() => {
    if (seen.current) return;
    seen.current = true;
    track(group === "low" ? "pricing_low_offer_viewed" : "pricing_premium_offer_viewed", experience);
  }, [group, experience]);

  const pick = (i: Interval) => {
    setInterval(i);
    track(`pricing_${group}_${i}_selected` as const, experience);
  };
  const go = () => {
    track(group === "low" ? "pricing_low_checkout_started" : "pricing_premium_checkout_started", experience);
    void navigate({ to: "/pro", search: { plan: PRO_PRICES[group][interval].id, back } });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <p className="eyebrow">Preliminary analysis</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">Your Skin Analysis Is Ready</h1>
      <p className="mt-2 text-sm text-muted-foreground">Unlock personalized insights and start tracking your skin journey.</p>

      <section className="surface mt-5 p-5" aria-label="Free preview">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your free preview</p>
        {typeof preview.score === "number" && <p className="mt-2 font-display text-2xl text-foreground">Visible redness: {preview.score}/100</p>}
        {preview.summary && <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">{preview.summary}</p>}
        {preview.point && <p className="mt-2 text-sm text-muted-foreground">• {preview.point}</p>}
        <p className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs font-semibold text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Full face map, all observations and daily tips are included with Pro
        </p>
      </section>

      <section className="surface-lift mt-5 p-5">
        <p className="font-display text-xl text-foreground">Rosea.AI Pro includes:</p>
        <ProFeatures />
        <div className="mt-5"><PlanPicker group={group} interval={interval} onChange={pick} /></div>
        <Button className="mt-4 w-full" size="lg" onClick={go}>Continue to secure checkout</Button>
      </section>

      <Button asChild variant="ghost" className="mt-4 w-full"><Link to="/">Not now</Link></Button>
    </div>
  );
}
