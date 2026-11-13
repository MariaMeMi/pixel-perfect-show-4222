// Onboarding data model, option lists and branch rules.
// Each branch is a list of step ids so branches can be reordered / A-B tested independently.

export const ONBOARDING_KEY = "rosea.onboarding.v2";

export type GoalKey = "redness" | "dryness" | "lines" | "botox" | "overall";

export type Rating = "much_better" | "little_better" | "no_change" | "little_worse" | "much_worse" | "not_sure";
export type TreatmentResult = { stillUsing?: boolean; rating?: Rating; stopReasons: string[] };

export type OnboardingData = {
  version: 2;
  goals: GoalKey[];
  // redness
  diagnosed: string;
  symptoms: string[];
  understand: string;
  tried: string[];
  results: Record<string, TreatmentResult>;
  influences: string[];
  // lines
  lineAreas: string[];
  lineDoing: string[];
  // botox
  botoxWhen: string;
  botoxAreas: string[];
  botoxProduct: string;
  // dryness
  dryExperience: string[];
  dryUsing: string[];
  // baseline
  baselineEntryId?: string | undefined;
  baselinePhoto?: string | undefined; // only kept here when it could not be saved as a check-in
  baselineDate?: string;
  completedAt?: string;
};

export const emptyData = (): OnboardingData => ({
  version: 2, goals: [], diagnosed: "", symptoms: [], understand: "", tried: [], results: {}, influences: [],
  lineAreas: [], lineDoing: [], botoxWhen: "", botoxAreas: [], botoxProduct: "", dryExperience: [], dryUsing: [],
});

export const GOALS: { key: GoalKey; icon: string; title: string; text: string }[] = [
  { key: "redness", icon: "🔴", title: "Redness & flushing", text: "Track redness, flare-ups and changes over time" },
  { key: "dryness", icon: "💧", title: "Dryness & hydration", text: "Understand changes in dryness and how hydrated your skin appears" },
  { key: "lines", icon: "〰️", title: "Fine lines & wrinkles", text: "Track visible changes in lines and wrinkles" },
  { key: "botox", icon: "💉", title: "Botox progress", text: "Follow visible changes before and after treatment" },
  { key: "overall", icon: "✨", title: "Overall skin progress", text: "Build a visual history of how your skin changes" },
];

export const DIAGNOSED = ["Yes, by a dermatologist", "Yes, by another healthcare professional", "No", "I'm not sure"];
export const SYMPTOMS = ["Persistent redness", "Flushing that comes and goes", "Visible blood vessels", "Bumps or pimples", "Burning or stinging", "Dryness / tightness", "Itching", "Swelling", "Eye irritation / dryness", "Thickening of the skin", "Something else"];
export const UNDERSTAND = ["What might be associated with my flare-ups", "Whether my skin is improving", "Whether my current treatment/routine seems to be helping", "How my skin changes over time", "Keep a clearer history for dermatologist visits"];

export const NONE_TRIED = "I haven't tried anything yet";
export const TREATMENTS: { group: string; items: string[] }[] = [
  { group: "Prescription / medical", items: ["Ivermectin / Soolantra", "Azelaic acid / Finacea", "Metronidazole / MetroGel", "Doxycycline", "Minocycline", "Brimonidine / Mirvaso", "Oxymetazoline / Rhofade", "Other prescription treatment", "I don't remember the name"] },
  { group: "Procedures", items: ["IPL", "VBeam / Pulsed Dye Laser (PDL)", "KTP laser", "Other laser/light treatment", "Other procedure"] },
  { group: "Skincare / lifestyle", items: ["Moisturizer / barrier-supporting skincare", "Gentle cleanser", "Sunscreen / SPF", "Avoiding suspected triggers", "Diet changes", "Other"] },
];
/** Items that get their own follow-up screen. */
export const followUpTreatments = (tried: string[]) =>
  tried.filter((t) => ![NONE_TRIED, "Other", "I don't remember the name"].includes(t));
export const short = (t: string): string => t.split(" / ")[0] ?? t;

export const RATINGS: [Rating, string][] = [["much_better", "Much better"], ["little_better", "A little better"], ["no_change", "No noticeable change"], ["little_worse", "A little worse"], ["much_worse", "Much worse"], ["not_sure", "Not sure"]];
export const STOP_REASONS = ["Didn't help", "Made my skin worse", "Irritation / side effects", "Too expensive", "Doctor recommended stopping", "Finished treatment", "Other"];

export const NOT_SURE = "🤷 I'm not sure yet";
export const INFLUENCES = ["☀️ Sun", "🔥 Heat", "❄️ Cold", "🌡 Temperature changes", "😰 Stress", "🏃 Exercise", "🍷 Alcohol", "🌶 Spicy food", "☕ Hot drinks", "🍽 Certain foods", "🧴 Skincare", "😴 Poor sleep", "🩸 Hormonal / menstrual changes", "💊 Medication", "✈️ Travel"];
export const stripIcon = (s: string) => s.replace(/^[^\p{L}]+/u, "");

export const LINE_AREAS = ["Forehead lines", "Frown lines / \u201c11s\u201d", "Crow's feet", "Under-eye lines", "Smile lines", "Overall skin texture", "Other"];
export const BOTOX_TREATMENT = "Botox / neuromodulator";
export const LINE_DOING = [BOTOX_TREATMENT, "Retinol / retinoid", "Anti-aging skincare", "Professional facial treatments", "Laser/light treatment", "Microneedling", "Nothing currently", "Other"];

export const BOTOX_WHEN = ["Within the last 7 days", "1–2 weeks ago", "2–4 weeks ago", "1–3 months ago", "3–6 months ago", "More than 6 months ago", "I don't remember"];
export const BOTOX_AREAS = ["Forehead", "Frown lines / 11s", "Crow's feet", "Bunny lines", "Other"];
export const BOTOX_PRODUCTS = ["Botox", "Dysport", "Xeomin", "Jeuveau", "Daxxify", "Other", "I'm not sure"];

export const DRY_EXPERIENCE = ["Dryness", "Tightness", "Flaking", "Rough texture", "Dull appearance", "Irritation", "Makeup sitting poorly", "Other"];
export const DRY_USING = ["Moisturizer", "Hydrating serum", "Gentle cleanser", "SPF", "Retinol / retinoid", "Exfoliating acids", "Prescription skincare", "Facial oil", "Other", "Nothing currently"];

/** Toggle with optional exclusive options (e.g. "Nothing currently"). */
export function toggle(list: string[], item: string, exclusive: string[] = []) {
  if (list.includes(item)) return list.filter((x) => x !== item);
  if (exclusive.includes(item)) return [item];
  return [...list.filter((x) => !exclusive.includes(x)), item];
}

export type StepId =
  | "welcome" | "goals"
  | "r_diagnosed" | "r_symptoms" | "r_understand" | "r_tried" | `r_follow:${string}` | "r_influences"
  | "l_areas" | "l_doing"
  | "b_when" | "b_areas" | "b_product"
  | "d_experience" | "d_using"
  | "reflection" | "baseline" | "signup" | "building" | "gate" | "profile";

export const wantsBotox = (d: OnboardingData) => d.goals.includes("botox") || d.lineDoing.includes(BOTOX_TREATMENT);

/** Builds the ordered step list from the answers so far (progressive disclosure). */
export function buildSteps(d: OnboardingData): StepId[] {
  const s: StepId[] = ["welcome", "goals"];
  if (d.goals.includes("redness")) {
    // Kept short on purpose: more than half of starters left mid-questionnaire.
    s.push("r_diagnosed", "r_symptoms", "r_tried");
  }
  if (d.goals.includes("lines")) s.push("l_areas");
  if (wantsBotox(d)) s.push("b_when", "b_areas");
  if (d.goals.includes("dryness")) s.push("d_experience");
  s.push("reflection", "baseline", "signup", "building", "gate", "profile");
  return s;
}

/** Profile sections shown on the reflection and final screens — only what the user told us. */
export function profileSections(d: OnboardingData): { label: string; items: string[] }[] {
  const out: { label: string; items: string[] }[] = [];
  const goalTitles = d.goals.map((g) => GOALS.find((x) => x.key === g)!.title);
  out.push({ label: "Your goal", items: d.understand ? [d.understand] : goalTitles });
  const tracking = [
    ...d.symptoms.filter((x) => x !== "Something else"),
    ...d.lineAreas.filter((x) => x !== "Other"),
    ...d.botoxAreas.filter((x) => x !== "Other" && !d.lineAreas.length),
    ...d.dryExperience.filter((x) => x !== "Other"),
  ];
  out.push({ label: "You're tracking", items: tracking.length ? [...new Set(tracking)] : goalTitles });
  const current = [
    ...followUpTreatments(d.tried).filter((t) => d.results[t]?.stillUsing === true).map(short),
    ...d.lineDoing.filter((x) => !["Nothing currently", "Other"].includes(x)).map(short),
    ...d.dryUsing.filter((x) => !["Nothing currently", "Other"].includes(x)).map(short),
  ];
  if (current.length) out.push({ label: "Current routine / treatments", items: [...new Set(current)] });
  const before = followUpTreatments(d.tried).filter((t) => d.results[t]?.stillUsing === false).map(short);
  if (before.length) out.push({ label: "Previously tried", items: before });
  if (d.botoxWhen) out.push({ label: "Most recent treatment", items: [d.botoxWhen] });
  if (d.botoxProduct && d.botoxProduct !== "I'm not sure") out.push({ label: "Product", items: [d.botoxProduct] });
  const inf = d.influences.filter((x) => x !== NOT_SURE).map(stripIcon);
  if (inf.length) out.push({ label: "Possible influences", items: inf });
  return out;
}

export function closingLine(d: OnboardingData) {
  if (d.goals.length === 1 && d.goals[0] === "botox") return "Future check-ins can be compared with this baseline to help you document visible changes over time.";
  if (d.goals.length === 1 && d.goals[0] === "dryness") return "Rose AI will combine your self-reported symptoms and photo history to help you document changes over time.";
  return "Rose AI will help you compare your skin with this starting point as your history grows.";
}
