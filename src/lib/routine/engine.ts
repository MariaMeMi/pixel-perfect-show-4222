/** Rule-based routine builder. Pure logic — no UI, no network. Add new concerns by extending QUESTIONS + buildPlan. */

export type Answers = {
  help: string[]; feel: string; sensitivity: string; diagnosis: string; redness: string[];
  dryness: string; aging: string[]; budget: string; rx: string; urgent: string[];
};
export const emptyAnswers: Answers = { help: [], feel: "", sensitivity: "", diagnosis: "", redness: [], dryness: "", aging: [], budget: "", rx: "", urgent: [] };

export type Q = { key: keyof Answers; title: string; hint?: string; multi?: boolean; exclusive?: string[]; options: string[]; optional?: boolean };
export const QUESTIONS: Q[] = [
  { key: "help", title: "What would you like help with?", hint: "Choose all that apply.", multi: true, options: ["Rosacea / redness", "Dryness / dehydration", "Fine lines / wrinkles", "Sensitive / reactive skin", "Visible facial vessels", "Bumps / blemishes"] },
  { key: "feel", title: "How does your skin feel today?", options: ["Calm / comfortable", "Red / flushed", "Dry", "Tight after washing", "Red AND dry", "Burning / stinging", "Flaky / rough", "Very irritated"] },
  { key: "sensitivity", title: "How sensitive is your skin?", options: ["Not very sensitive", "Sometimes sensitive", "Very sensitive", "Products often sting or burn"] },
  { key: "diagnosis", title: "Do you have a rosacea diagnosis?", hint: "This helps us tailor your routine. We never diagnose rosacea.", options: ["Yes", "No", "I'm not sure"] },
  { key: "redness", title: "What type of redness do you notice?", hint: "Choose all that apply.", multi: true, exclusive: ["None"], options: ["General/diffuse redness", "Temporary flushing", "Visible small blood vessels", "Red bumps / pustules", "Burning or warmth", "None"] },
  { key: "dryness", title: "How dry is your skin?", options: ["Not dry", "Slightly dry", "Frequently tight", "Very dry", "Flaky / compromised"] },
  { key: "aging", title: "What are your anti-aging concerns?", hint: "Choose all that apply.", multi: true, exclusive: ["None"], options: ["None", "Prevention", "Fine lines", "Dryness lines", "Deeper wrinkles", "Uneven texture"] },
  { key: "budget", title: "What is your skincare budget?", options: ["$ — Budget", "$$ — Mid-range", "$$$ — Premium", "Show me all price levels"] },
  { key: "rx", title: "Are you currently using prescription rosacea treatment?", optional: true, options: ["No", "Metronidazole / Rozamet", "Ivermectin / Soolantra", "Azelaic acid", "Other prescription", "Prefer not to say"] },
  { key: "urgent", title: "Are you experiencing any of these right now?", hint: "Safety check — choose all that apply.", multi: true, exclusive: ["None of these"], options: ["Severe facial swelling", "Eye pain or significant eye symptoms", "A rapidly worsening reaction", "Severe pain", "Signs of infection (pus, fever, spreading warmth)", "Difficulty breathing", "None of these"] },
];

export type Product = {
  id: string; brand: string; name: string; category: string; purpose: string; concerns: string[];
  price_tier: number; approx_price: number | null; key_ingredients: string[]; fragrance_free: boolean | null;
  best_for: string; why: string; image_url: string | null; normal_url: string | null; affiliate_url: string | null;
  sponsored: boolean; rank: number;
};

export type Step = { label: string; category?: string; why: string; rx?: boolean; optional?: boolean };
export type Plan = {
  urgent?: { emergency: boolean };
  today: string[]; priority: string; priorityText: string; routineStyle: string;
  rescue: boolean; am: Step[]; pm: Step[]; rx?: string; vessels: boolean;
  advanced: { show: boolean; items: string[]; note: string }; hydrateFirst: boolean; tags: string[];
};

const has = (a: string[], s: string) => a.includes(s);

export function buildPlan(a: Answers): Plan {
  const urgentPicked = a.urgent.filter((u) => u !== "None of these");
  const redness = has(a.help, "Rosacea / redness") || a.diagnosis === "Yes" || ["Red / flushed", "Red AND dry"].includes(a.feel) || a.redness.some((r) => r !== "None");
  const sensitive = has(a.help, "Sensitive / reactive skin") || ["Very sensitive", "Products often sting or burn"].includes(a.sensitivity);
  const dryLevel = a.dryness === "Slightly dry" ? 1 : a.dryness === "Frequently tight" ? 2 : ["Very dry", "Flaky / compromised"].includes(a.dryness) ? 3 : 0;
  const dry = dryLevel > 0 || has(a.help, "Dryness / dehydration") || ["Dry", "Tight after washing", "Red AND dry", "Flaky / rough"].includes(a.feel);
  const dl = Math.max(dryLevel, dry ? 1 : 0, a.feel === "Tight after washing" ? 2 : 0);
  const lines = has(a.help, "Fine lines / wrinkles") || a.aging.some((x) => x !== "None");
  const rescue = ["Burning / stinging", "Very irritated", "Flaky / rough"].includes(a.feel) || a.sensitivity === "Products often sting or burn" || a.dryness === "Flaky / compromised" || has(a.redness, "Burning or warmth");
  const irritated = rescue || a.feel === "Red / flushed";
  const vessels = has(a.help, "Visible facial vessels") || has(a.redness, "Visible small blood vessels");
  const rx = a.rx && !["No", "Prefer not to say"].includes(a.rx) ? a.rx : undefined;

  const today = [redness && "Redness", dry && "Dryness", sensitive && "Sensitive", lines && "Fine lines"].filter(Boolean) as string[];
  const tags = [redness && "redness", dry && "dryness", sensitive && "sensitive", lines && "lines", dl >= 2 && "barrier", dl >= 3 && "rich", dl === 1 && "light"].filter(Boolean) as string[];
  const base = { today, tags, rescue, vessels, rx, hydrateFirst: false };
  const told = (bits: string[]) => `You told us: ${bits.filter(Boolean).join(", ").toLowerCase()}.`;
  const answerBits = [a.feel, a.sensitivity, a.dryness !== "Not dry" ? a.dryness : ""].filter(Boolean);
  const rxStep = (): Step[] => rx ? [{ label: "Your prescribed rosacea treatment", rx: true, why: "Use your prescribed rosacea treatment according to your clinician's instructions." }] : [];
  const moistCat = redness && !dry && !rescue ? "redness_moisturizer" : "moisturizer";
  const moistWhy = dl >= 2 || rescue ? `${told(answerBits)} We prioritized a fragrance-free barrier moisturizer rather than adding active ingredients.` : redness ? "A moisturizer designed for redness-prone skin keeps your routine to one product per step." : "A simple moisturizer helps maintain hydration.";
  const spf: Step = { label: "Broad-spectrum SPF 30–50+", category: "sunscreen", why: "Daily sun protection is one of the most helpful steps for redness-prone and aging-concerned skin. We chose mineral options suited to sensitive skin." };
  const cleanser: Step = { label: "Gentle cleanser", category: "cleanser", why: "A gentle, fragrance-free cleanser removes the day without stripping the skin barrier." };

  // Safety escalation first
  if (urgentPicked.length) {
    return { ...base, urgent: { emergency: has(urgentPicked, "Difficulty breathing") }, priority: "", priorityText: "", routineStyle: "", am: [], pm: [], advanced: { show: false, items: [], note: "" } };
  }

  const advanced = {
    show: !rescue && !irritated,
    items: lines ? ["Retinoids / retinol", "Antioxidant serum", "Enzyme exfoliation", "Salicylic acid"] : ["Enzyme exfoliation", "Salicylic acid", "Stronger actives"],
    note: redness || sensitive ? "Retinoids and exfoliants can irritate sensitive or redness-prone skin. Introduce one at a time, cautiously, only once your skin feels stable." : "Introduce one new active at a time and watch how your skin responds.",
  };

  if (rescue) {
    return { ...base, priority: "BARRIER RESCUE MODE", routineStyle: "Simple + protective",
      priorityText: "Your skin currently sounds highly reactive. Keep the routine simple and focus on gentle cleansing, moisturization and your clinician-directed treatment. If a prescription causes significant irritation, contact the prescribing clinician.",
      am: [{ label: "Gentle rinse or cleanse", category: "cleanser", why: cleanser.why }, { label: "Simple moisturizer", category: "moisturizer", why: moistWhy }, spf],
      pm: [cleanser, ...rxStep().map((s) => ({ ...s, label: "Prescribed treatment — only as directed" })), { label: "Barrier moisturizer", category: dl >= 3 ? "rescue" : "moisturizer", why: dl >= 3 ? "A protective rescue cream supports particularly dry, flaky areas." : moistWhy }],
      advanced: { show: false, items: [], note: "" } };
  }

  if (redness && dry) {
    return { ...base, priority: "CALM + REPAIR", routineStyle: "Gentle + barrier focused",
      priorityText: "Your answers suggest redness together with dryness or barrier weakness. Your routine should prioritize calming the skin while restoring moisture and barrier support.",
      am: [{ ...cleanser, label: "Gentle cleanse or rinse" }, ...rxStep(), { label: "Calming serum (if tolerated)", category: "calming", optional: true, why: "You mentioned redness, so a calming step can help reduce its appearance — skip it on days your skin feels sensitive." }, { label: "Barrier moisturizer", category: "moisturizer", why: moistWhy }, spf],
      pm: [cleanser, ...rxStep(), { label: "Barrier moisturizer", category: "moisturizer", why: moistWhy }], advanced };
  }

  if (dry && lines) {
    return { ...base, hydrateFirst: true, priority: "HYDRATE FIRST", routineStyle: "Hydration + barrier",
      priorityText: "Dehydration can make fine lines look more noticeable. Start by improving hydration and barrier support before adding multiple anti-aging products.",
      am: [{ ...cleanser, label: "Gentle cleanse or rinse" }, { label: "Moisturizer", category: "moisturizer", why: moistWhy }, spf],
      pm: [cleanser, { label: "Barrier moisturizer", category: "moisturizer", why: moistWhy }], advanced };
  }

  if (redness || sensitive) {
    const stable = !irritated;
    return { ...base, priority: lines && stable ? "CALM, THEN GENTLE ANTI-AGING" : "CALM + PROTECT", routineStyle: "Gentle + calming",
      priorityText: lines ? "We put rosacea and sensitivity stability first. Once your skin feels calm, you can explore gentle anti-aging options below." : "Your answers point to redness-prone or sensitive skin. Gentle cleansing, calming care, a moisturizer and daily SPF come first.",
      am: [{ ...cleanser, label: "Gentle cleanse or rinse" }, ...rxStep(), ...(redness ? [{ label: "Calming / redness product (if needed)", category: "calming", optional: true, why: "You mentioned redness, so a single calming step can help reduce its appearance." }] : []), { label: "Moisturizer", category: moistCat, why: moistWhy }, spf],
      pm: [{ label: "Remove makeup / sunscreen if needed", category: "micellar", optional: true, why: "Optional — useful for makeup or sunscreen removal. Not required." }, cleanser, ...rxStep(), { label: "Barrier moisturizer", category: "moisturizer", why: moistWhy }], advanced };
  }

  if (lines) {
    return { ...base, priority: "SMOOTH + PROTECT", routineStyle: "Tolerant skin, anti-aging",
      priorityText: "Your skin sounds tolerant, so a gentle anti-aging active and daily SPF can help fine lines appear less noticeable over time.",
      am: [cleanser, { label: "Antioxidant (optional)", category: "antioxidant", optional: true, why: "You selected anti-aging concerns and your skin sounds tolerant, so an antioxidant is an optional morning step." }, { label: "Moisturizer", category: "moisturizer", why: moistWhy }, spf],
      pm: [cleanser, { label: "Anti-aging active", category: "anti_aging", why: "A gentle retinoid helps fine lines appear less noticeable. Start 2–3 nights a week." }, { label: "Moisturizer", category: "moisturizer", why: moistWhy }], advanced };
  }

  return { ...base, priority: dry ? "HYDRATE + MAINTAIN" : "KEEP IT SIMPLE", routineStyle: "Simple essentials",
    priorityText: dry ? "Your answers suggest dryness. Consistent hydration and barrier support come first." : "Your skin sounds comfortable. A simple cleanse, moisturize and protect routine is all you need.",
    am: [cleanser, { label: "Moisturizer", category: "moisturizer", why: moistWhy }, spf], pm: [cleanser, { label: "Moisturizer", category: "moisturizer", why: moistWhy }], advanced };
}

export const budgetTier = (b: string) => (b.startsWith("$$$") ? 3 : b.startsWith("$$") ? 2 : b.startsWith("$") ? 1 : 0);
export const tierLabel = (t: number) => "$".repeat(t);

/** Safety & suitability first, budget second, sponsorship never decides Best Match. */
export function pickProducts(all: Product[], category: string, tags: string[], budget: number) {
  const pool = all.filter((p) => p.category === category);
  const score = (p: Product) => p.concerns.filter((c) => tags.includes(c)).length * 10 + (p.fragrance_free ? 3 : 0) - p.rank / 20 - (budget && p.price_tier !== budget ? 6 : 0);
  const organic = pool.filter((p) => !p.sponsored).sort((x, y) => score(y) - score(x));
  const best = organic[0];
  const alts = organic.slice(1).sort((x, y) => (x.price_tier === best?.price_tier ? 1 : 0) - (y.price_tier === best?.price_tier ? 1 : 0)).slice(0, 2);
  const sponsored = pool.find((p) => p.sponsored);
  return { best, alts, sponsored };
}

export const shopUrl = (p: Product) => p.affiliate_url || p.normal_url || undefined;
