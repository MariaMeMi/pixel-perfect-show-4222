/** Client-safe pricing for the English Rosea.AI Pro price test. Only prices differ between groups. */
export type PricingGroup = "low" | "premium";
export type Interval = "monthly" | "yearly";

export const PRO_PRICES = {
  low: {
    monthly: { id: "pro_monthly_low", cents: 999, label: "$9.99" },
    yearly: { id: "pro_yearly_low", cents: 5999, label: "$59.99" },
  },
  premium: {
    monthly: { id: "pro_monthly_premium", cents: 1999, label: "$19.99" },
    yearly: { id: "pro_yearly_premium", cents: 9999, label: "$99.99" },
  },
} as const satisfies Record<PricingGroup, Record<Interval, { id: string; cents: number; label: string }>>;

export type ProPriceId = (typeof PRO_PRICES)[PricingGroup][Interval]["id"];

export function priceInfo(id: string): { group: PricingGroup; interval: Interval; cents: number; label: string } | null {
  for (const group of ["low", "premium"] as const) {
    for (const interval of ["monthly", "yearly"] as const) {
      const p = PRO_PRICES[group][interval];
      if (p.id === id) return { group, interval, cents: p.cents, label: p.label };
    }
  }
  return null;
}

/** "$5.00" monthly equivalent of a yearly price. */
export function perMonth(cents: number) {
  return `$${(Math.round(cents / 12) / 100).toFixed(2)}`;
}

export const PRO_FEATURES = [
  "Personalized skincare and makeup recommendations",
  "Skin history and progress tracking",
  "Potential trigger tracking",
  "Treatment and procedure progress journal",
];

export function renewalTerms(interval: Interval, label: string) {
  const period = interval === "monthly" ? "month" : "year";
  return `You'll be charged ${label} today. Your subscription renews automatically every ${period} at ${label} until you cancel. Cancel anytime in Profile → Manage subscription; you keep Pro until the end of the period you've paid for. No free trial. Prices in USD; taxes may apply.`;
}

const GROUP_KEY = "rose.pricing.group";
const AT_KEY = "rose.pricing.assignedAt";
const D7_KEY = "rose.pricing.d7";

/** Sticky 50/50 assignment, stored on this device. */
export function pricingGroup(): PricingGroup {
  if (typeof window === "undefined") return "low";
  try {
    let g = localStorage.getItem(GROUP_KEY);
    if (g !== "low" && g !== "premium") {
      g = Math.random() < 0.5 ? "low" : "premium";
      localStorage.setItem(GROUP_KEY, g);
      localStorage.setItem(AT_KEY, String(Date.now()));
    }
    return g as PricingGroup;
  } catch {
    return "low";
  }
}

/** Returns the group if this device returned 7+ days after assignment and hasn't been counted yet. */
export function takeD7Return(): PricingGroup | null {
  try {
    const g = localStorage.getItem(GROUP_KEY), at = Number(localStorage.getItem(AT_KEY));
    if ((g !== "low" && g !== "premium") || !at || localStorage.getItem(D7_KEY)) return null;
    if (Date.now() - at < 7 * 864e5) return null;
    localStorage.setItem(D7_KEY, "1");
    return g;
  } catch {
    return null;
  }
}
