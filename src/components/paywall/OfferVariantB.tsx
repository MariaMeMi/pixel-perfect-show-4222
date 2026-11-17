import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track, type Experience } from "@/lib/experiment";

const KEY = "rose.paywall.variant";

/** Sticky 50/50 assignment for the English paywall test. Returns "A" (control) or "B" (offer). */
export function paywallVariant(): "A" | "B" {
  if (typeof window === "undefined") return "A";
  try {
    let v = localStorage.getItem(KEY);
    if (v !== "A" && v !== "B") {
      v = Math.random() < 0.5 ? "A" : "B";
      localStorage.setItem(KEY, v);
    }
    return v as "A" | "B";
  } catch {
    return "A";
  }
}

const FEATURES = [
  "Personalized skincare and makeup recommendations",
  "Skin history and progress tracking",
  "Potential trigger tracking",
  "Treatment and procedure progress journal",
];

type Plan = "monthly" | "yearly" | "onetime";

/** Offer preview only: no payment is taken. Clicks are recorded as interest. */
export function OfferVariantB({ experience, preview, onContinue }: {
  experience: Experience;
  preview: { score?: number; summary?: string; point?: string };
  onContinue: () => void;
}) {
  const [plan, setPlan] = useState<Plan>("yearly");
  const [noted, setNoted] = useState(false);

  const choose = () => {
    track(plan === "monthly" ? "paywall_b_monthly_clicked" : plan === "yearly" ? "paywall_b_yearly_clicked" : "paywall_b_onetime_clicked", experience);
    setNoted(true);
  };

  const option = (id: Plan, title: string, price: string, note: string, badge?: string) => (
    <button type="button" onClick={() => setPlan(id)} aria-pressed={plan === id}
      className={`relative flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition-colors ${plan === id ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
      <span>
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{note}</span>
      </span>
      <span className="text-right font-display text-xl text-foreground">{price}</span>
      {badge && <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">{badge}</span>}
    </button>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <p className="eyebrow">Preliminary analysis</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">Your Skin Analysis Is Ready</h1>
      <p className="mt-2 text-sm text-muted-foreground">Unlock personalized insights and start tracking your skin journey.</p>

      <section className="surface mt-5 p-5" aria-label="Free summary">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your free summary</p>
        {typeof preview.score === "number" && <p className="mt-2 font-display text-2xl text-foreground">Visible redness: {preview.score}/100</p>}
        {preview.summary && <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">{preview.summary}</p>}
        {preview.point && <p className="mt-2 text-sm text-muted-foreground">• {preview.point}</p>}
      </section>

      <section className="surface-lift mt-5 p-5">
        <p className="font-display text-xl text-foreground">Rosea.AI Pro includes:</p>
        <ul className="mt-3 space-y-2">{FEATURES.map((f) => (
          <li key={f} className="flex gap-2 text-sm text-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>))}</ul>
        <div className="mt-5 space-y-3">
          {option("monthly", "Monthly", "$19.99", "Renews every month at $19.99")}
          {option("yearly", "Yearly", "$99.99", "Renews every year at $99.99 · about $8.33/mo", "Best value")}
          {option("onetime", "Full analysis only", "$1.99", "One-time payment · no subscription")}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {plan === "onetime"
            ? "One-time purchase of this full analysis. You won't be charged again and nothing renews."
            : `Subscription renews automatically at ${plan === "monthly" ? "$19.99 per month" : "$99.99 per year"} until you cancel. Cancel anytime before the renewal date to avoid being charged for the next period. Prices in USD; taxes may apply.`}
        </p>
        <Button className="mt-4 w-full" size="lg" onClick={choose}>
          {plan === "onetime" ? "Get full analysis · $1.99" : `Start Pro ${plan === "monthly" ? "Monthly" : "Yearly"}`}
        </Button>
        {noted && <p role="status" className="mt-3 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
          Rosea.AI Pro isn't available yet — thanks, we've noted your interest. No payment was taken.
        </p>}
      </section>

      <Button variant="ghost" className="mt-4 w-full" onClick={() => { track("paywall_b_dismissed", experience); onContinue(); }}>
        <X className="mr-1 h-4 w-4" /> Continue with free results
      </Button>
    </div>
  );
}
