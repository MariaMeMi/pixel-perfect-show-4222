import type { Lang } from "@/lib/i18n";

export type LineArea = "forehead" | "glabella" | "eyes";
export type LineLevel = "not_prominent" | "visible_with_expression" | "visible_at_rest";
export type Goal = "soften" | "natural" | "preventative" | "options" | "curious";
export type Milestone = "before" | "w1" | "w2" | "m1" | "m3";

export interface LineAnalysis {
  id: string;
  date: string;
  forehead: { level: LineLevel; noticed: string };
  glabella: { level: LineLevel; noticed: string };
  eyes: { level: LineLevel; noticed: string };
  symmetry: string;
  summary: string;
  sample?: boolean;
}

export interface BotoxState {
  analyses: LineAnalysis[];
  goals: Goal[];
  tracking: Partial<Record<Milestone, { photo: string; date: string }>>;
}

const KEY = "rosea.botox.v1";
export const MILESTONES: Milestone[] = ["before", "w1", "w2", "m1", "m3"];
export const AREAS: LineArea[] = ["forehead", "glabella", "eyes"];
export const GOALS: Goal[] = ["soften", "natural", "preventative", "options", "curious"];

export function loadBotox(): BotoxState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as BotoxState;
  } catch {
    /* ignore */
  }
  return { analyses: [], goals: [], tracking: {} };
}

export function saveBotox(state: BotoxState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
  window.dispatchEvent(new Event("rosea:botox"));
}

export function sampleAnalysis(lang: Lang): LineAnalysis {
  const de = lang === "de";
  return {
    id: "sample",
    date: new Date().toISOString(),
    sample: true,
    forehead: {
      level: "visible_with_expression",
      noticed: de
        ? "Horizontale Linien werden sichtbarer, wenn du die Augenbrauen hebst, und sind im entspannten Gesicht kaum zu sehen."
        : "Horizontal lines become more visible when you raise your eyebrows and are less visible when your face is relaxed.",
    },
    glabella: {
      level: "visible_with_expression",
      noticed: de
        ? "Beim leichten Stirnrunzeln zeigen sich zwei feine senkrechte Linien zwischen den Augenbrauen."
        : "Two fine vertical lines appear between the eyebrows during a gentle frown.",
    },
    eyes: {
      level: "not_prominent",
      noticed: de
        ? "Beim Lächeln sind an den Augenwinkeln nur sehr feine Linien erkennbar."
        : "Only very fine lines are visible at the outer corners of the eyes when smiling.",
    },
    symmetry: de
      ? "Die Mimik wirkt auf beiden Seiten weitgehend gleichmäßig."
      : "Expressions look largely even on both sides.",
    summary: de
      ? "Die meisten sichtbaren Linien erscheinen vor allem bei Bewegung."
      : "Most visible lines appear mainly with movement.",
  };
}

/** Very light client-side quality check: size, brightness and contrast. */
export async function checkQuality(dataUrl: string): Promise<"ok" | "dark" | "bright" | "flat"> {
  const img = new Image();
  await new Promise((r, j) => {
    img.onload = r;
    img.onerror = j;
    img.src = dataUrl;
  });
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");
  if (!ctx) return "ok";
  ctx.drawImage(img, 0, 0, 64, 64);
  const d = ctx.getImageData(0, 0, 64, 64).data;
  let sum = 0;
  let sq = 0;
  const n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) {
    const y = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
    sum += y;
    sq += y * y;
  }
  const mean = sum / n;
  const sd = Math.sqrt(sq / n - mean * mean);
  if (mean < 55) return "dark";
  if (mean > 225) return "bright";
  if (sd < 18) return "flat";
  return "ok";
}

type Dict = Record<string, string>;
const en: Dict = {
  title: "Botox AI",
  subtitle: "Explore your face and prepare for a professional consultation.",
  tagline: "Explore visible facial lines.",
  homeBody: "Explore visible facial lines and learn what to discuss with a qualified provider.",
  homeCta: "Analyze my face",
  safetyTitle: "Before you begin",
  safety:
    "Botulinum toxin injections are medical/cosmetic procedures. They should only be assessed and administered by appropriately qualified professionals. Botox AI is educational — it doesn't tell you whether you need treatment, suggest doses or injection points, or replace a consultation.",
  understand: "I understand",
  sample: "See a sample result",
  step: "Photo",
  of: "of",
  "pose.0": "Relaxed, neutral expression",
  "pose.1": "Raise your eyebrows",
  "pose.2": "Smile naturally",
  "pose.3": "Gentle frown",
  guide1: "Face a window or soft daylight",
  guide2: "Hold the phone at eye level, arm's length",
  guide3: "Hair away from forehead, no glasses",
  takePhoto: "Take photo",
  upload: "Upload",
  retake: "Retake",
  next: "Use photo",
  closeCamera: "Close camera",
  cameraError: "Camera unavailable. You can upload a photo instead.",
  "q.dark": "This photo looks quite dark. Try facing a window.",
  "q.bright": "This photo looks overexposed. Step out of direct light.",
  "q.flat": "This photo looks blurry or low in detail. Try again holding still.",
  "q.ok": "Photo quality looks good.",
  analyzing: "Analyzing facial features…",
  resultTitle: "Your facial analysis",
  tapArea: "Tap an area to learn more",
  "area.forehead": "Forehead",
  "area.glabella": "Between eyebrows",
  "area.eyes": "Eye area",
  "cat.forehead": "Forehead lines",
  "cat.glabella": "Frown lines",
  "cat.eyes": "Eye-area lines",
  "level.not_prominent": "Not prominent",
  "level.visible_with_expression": "Visible with expression",
  "level.visible_at_rest": "Visible at rest",
  noticed: "What we noticed",
  why: "Why this area is commonly discussed",
  ask: "Questions to ask a qualified provider",
  learnArea: "Learn about this area",
  symmetry: "Symmetry",
  prepTitle: "Prepare for a consultation",
  prepBody: "What are you hoping to learn? Choose any that fit.",
  "goal.soften": "Soften visible lines",
  "goal.natural": "Maintain natural movement",
  "goal.preventative": "Learn about preventative options",
  "goal.options": "Understand treatment options",
  "goal.curious": "I'm just curious",
  yourQuestions: "Your questions to bring",
  copy: "Copy questions",
  copied: "Questions copied",
  trackTitle: "Before & after tracking",
  trackBody:
    "Optional. If you receive treatment from a qualified provider, you can keep your own photo diary here. Changes over time can have many causes.",
  "m.before": "Before treatment",
  "m.w1": "1 week",
  "m.w2": "2 weeks",
  "m.m1": "1 month",
  "m.m3": "3 months",
  add: "Add photo",
  remove: "Remove",
  compare: "Compare",
  compareNote: "Side-by-side view. We don't claim any change was caused by a treatment.",
  save: "Save analysis",
  saved: "Analysis saved on this device",
  newAnalysis: "New analysis",
  deleteAll: "Delete Botox AI data",
  deleted: "Botox AI data deleted",
  disclaimer:
    "Educational observations only — not a diagnosis, treatment recommendation or assessment of suitability. Only a qualified professional can evaluate you.",
  privacy: "Your four photos are sent only for this analysis and are not saved.",
  sampleBadge: "Sample",
  history: "Previous analyses",
  back: "Back",
};

const de: Dict = {
  title: "Botox AI",
  subtitle: "Entdecke dein Gesicht und bereite dich auf eine professionelle Beratung vor.",
  tagline: "Sichtbare Gesichtslinien entdecken.",
  homeBody: "Entdecke sichtbare Gesichtslinien und erfahre, was du mit qualifizierten Fachleuten besprechen kannst.",
  homeCta: "Gesicht analysieren",
  safetyTitle: "Bevor du beginnst",
  safety:
    "Injektionen mit Botulinumtoxin sind medizinische/kosmetische Eingriffe. Sie sollten nur von entsprechend qualifizierten Fachleuten beurteilt und durchgeführt werden. Botox AI dient der Information – es sagt dir nicht, ob du eine Behandlung brauchst, nennt keine Dosen oder Injektionsstellen und ersetzt keine Beratung.",
  understand: "Verstanden",
  sample: "Beispielergebnis ansehen",
  step: "Foto",
  of: "von",
  "pose.0": "Entspannter, neutraler Ausdruck",
  "pose.1": "Augenbrauen anheben",
  "pose.2": "Natürlich lächeln",
  "pose.3": "Leicht die Stirn runzeln",
  guide1: "Zum Fenster oder weichen Tageslicht drehen",
  guide2: "Handy auf Augenhöhe, eine Armlänge entfernt",
  guide3: "Haare aus der Stirn, keine Brille",
  takePhoto: "Foto aufnehmen",
  upload: "Hochladen",
  retake: "Neu aufnehmen",
  next: "Foto verwenden",
  closeCamera: "Kamera schließen",
  cameraError: "Kamera nicht verfügbar. Du kannst stattdessen ein Foto hochladen.",
  "q.dark": "Das Foto wirkt recht dunkel. Dreh dich zum Fenster.",
  "q.bright": "Das Foto wirkt überbelichtet. Geh aus dem direkten Licht.",
  "q.flat": "Das Foto wirkt unscharf. Versuch es noch einmal ruhig.",
  "q.ok": "Die Fotoqualität sieht gut aus.",
  analyzing: "Gesichtsmerkmale werden analysiert…",
  resultTitle: "Deine Gesichtsanalyse",
  tapArea: "Tippe auf einen Bereich für mehr Infos",
  "area.forehead": "Stirn",
  "area.glabella": "Zwischen den Augenbrauen",
  "area.eyes": "Augenbereich",
  "cat.forehead": "Stirnlinien",
  "cat.glabella": "Zornesfalten",
  "cat.eyes": "Linien am Auge",
  "level.not_prominent": "Kaum sichtbar",
  "level.visible_with_expression": "Sichtbar bei Mimik",
  "level.visible_at_rest": "Sichtbar in Ruhe",
  noticed: "Was uns aufgefallen ist",
  why: "Warum dieser Bereich oft besprochen wird",
  ask: "Fragen an qualifizierte Fachleute",
  learnArea: "Mehr über diesen Bereich",
  symmetry: "Symmetrie",
  prepTitle: "Auf eine Beratung vorbereiten",
  prepBody: "Was möchtest du herausfinden? Wähle alles Passende.",
  "goal.soften": "Sichtbare Linien abmildern",
  "goal.natural": "Natürliche Mimik erhalten",
  "goal.preventative": "Über vorbeugende Optionen informieren",
  "goal.options": "Behandlungsoptionen verstehen",
  "goal.curious": "Ich bin nur neugierig",
  yourQuestions: "Deine Fragen für die Beratung",
  copy: "Fragen kopieren",
  copied: "Fragen kopiert",
  trackTitle: "Vorher-Nachher-Verlauf",
  trackBody:
    "Optional. Wenn du dich von qualifizierten Fachleuten behandeln lässt, kannst du hier dein eigenes Fototagebuch führen. Veränderungen können viele Ursachen haben.",
  "m.before": "Vor der Behandlung",
  "m.w1": "1 Woche",
  "m.w2": "2 Wochen",
  "m.m1": "1 Monat",
  "m.m3": "3 Monate",
  add: "Foto hinzufügen",
  remove: "Entfernen",
  compare: "Vergleichen",
  compareNote: "Nebeneinander-Ansicht. Wir behaupten nicht, dass eine Veränderung durch eine Behandlung entstanden ist.",
  save: "Analyse speichern",
  saved: "Analyse auf diesem Gerät gespeichert",
  newAnalysis: "Neue Analyse",
  deleteAll: "Botox-AI-Daten löschen",
  deleted: "Botox-AI-Daten gelöscht",
  disclaimer:
    "Nur informative Beobachtungen – keine Diagnose, Behandlungsempfehlung oder Eignungsbeurteilung. Nur qualifizierte Fachleute können dich beurteilen.",
  privacy: "Deine vier Fotos werden nur für diese Analyse gesendet und nicht gespeichert.",
  sampleBadge: "Beispiel",
  history: "Frühere Analysen",
  back: "Zurück",
};

export function bt(lang: Lang) {
  const d = lang === "de" ? de : en;
  return (k: string) => d[k] ?? en[k] ?? k;
}

const ABOUT: Record<Lang, Record<LineArea, string>> = {
  en: {
    forehead:
      "Forehead lines are one of the areas that may be discussed during a cosmetic consultation. Treatment suitability depends on facial anatomy, muscle movement, medical history, goals, and professional assessment.",
    glabella:
      "Lines between the eyebrows form with frowning and concentrating. They're commonly discussed in consultations; whether any option is appropriate depends on your anatomy, health history and a professional's assessment.",
    eyes:
      "Lines at the outer corners of the eyes often appear with smiling. Many people discuss this area, and a qualified provider can explain the range of options — including doing nothing — for your situation.",
  },
  de: {
    forehead:
      "Stirnlinien gehören zu den Bereichen, die in einer kosmetischen Beratung besprochen werden können. Ob eine Behandlung geeignet ist, hängt von Anatomie, Muskelbewegung, Krankengeschichte, Zielen und fachlicher Beurteilung ab.",
    glabella:
      "Linien zwischen den Augenbrauen entstehen beim Stirnrunzeln und Konzentrieren. Sie werden häufig besprochen; ob eine Option passt, hängt von Anatomie, Gesundheitsgeschichte und fachlicher Beurteilung ab.",
    eyes:
      "Linien an den äußeren Augenwinkeln zeigen sich oft beim Lächeln. Qualifizierte Fachleute können die Möglichkeiten – auch das Nichtstun – für deine Situation erklären.",
  },
};
export const aboutArea = (lang: Lang, a: LineArea) => ABOUT[lang][a];

const AREA_Q: Record<Lang, Record<LineArea, string[]>> = {
  en: {
    forehead: [
      "How does my forehead movement affect which options you'd consider?",
      "Could treating this area change how my eyebrows sit or move?",
    ],
    glabella: ["What causes the lines between my eyebrows to show when I frown?", "What are non-injectable options for this area?"],
    eyes: ["Are the lines around my eyes related to movement, skin texture or both?", "How would you keep my smile looking natural?"],
  },
  de: {
    forehead: [
      "Wie beeinflusst die Bewegung meiner Stirn, welche Optionen du in Betracht ziehst?",
      "Könnte eine Behandlung hier die Lage oder Bewegung meiner Augenbrauen verändern?",
    ],
    glabella: ["Warum zeigen sich die Linien zwischen meinen Augenbrauen beim Stirnrunzeln?", "Welche Optionen ohne Injektion gibt es für diesen Bereich?"],
    eyes: ["Hängen die Linien um meine Augen mit Bewegung, Hautstruktur oder beidem zusammen?", "Wie bleibt mein Lächeln natürlich?"],
  },
};
export const areaQuestions = (lang: Lang, a: LineArea) => AREA_Q[lang][a];

const BASE: Record<Lang, string[]> = {
  en: [
    "What are the potential risks and side effects for me?",
    "Is treatment appropriate given my skin and medical history?",
    "Are there alternatives to botulinum toxin treatment?",
    "What are your qualifications and how often do you perform this?",
  ],
  de: [
    "Welche möglichen Risiken und Nebenwirkungen gibt es für mich?",
    "Ist eine Behandlung angesichts meiner Haut und Krankengeschichte angemessen?",
    "Gibt es Alternativen zur Behandlung mit Botulinumtoxin?",
    "Welche Qualifikationen hast du und wie oft führst du das durch?",
  ],
};
const GOAL_Q: Record<Lang, Record<Goal, string>> = {
  en: {
    soften: "What options could address my concerns, and what's realistic to expect?",
    natural: "What options could address my concerns while maintaining natural movement?",
    preventative: "What does the evidence say about starting preventative treatment, and when is it not recommended?",
    options: "Can you walk me through all my options, including non-injectable ones and doing nothing?",
    curious: "What should I know before deciding whether to explore any treatment at all?",
  },
  de: {
    soften: "Welche Optionen könnten meine Anliegen ansprechen, und was ist realistisch?",
    natural: "Welche Optionen könnten meine Anliegen ansprechen und dabei die natürliche Mimik erhalten?",
    preventative: "Was sagt die Evidenz über vorbeugende Behandlungen, und wann wird davon abgeraten?",
    options: "Kannst du mir alle Optionen erklären, auch solche ohne Injektion und das Nichtstun?",
    curious: "Was sollte ich wissen, bevor ich überhaupt über eine Behandlung nachdenke?",
  },
};
const DURATION: Record<Lang, string> = {
  en: "How long might results typically last, and what happens when they wear off?",
  de: "Wie lange halten Ergebnisse typischerweise, und was passiert, wenn sie nachlassen?",
};

export function buildQuestions(lang: Lang, goals: Goal[], analysis?: LineAnalysis): string[] {
  const qs: string[] = goals.map((g) => GOAL_Q[lang][g]);
  if (analysis) {
    for (const a of AREAS) if (analysis[a].level !== "not_prominent") qs.push(AREA_Q[lang][a][0]!);
  }
  if (!goals.includes("curious")) qs.push(DURATION[lang]);
  qs.push(...BASE[lang]);
  return [...new Set(qs)];
}
