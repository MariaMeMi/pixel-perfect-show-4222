import skincareImg from "@/assets/learn-skincare.jpg";
import sunImg from "@/assets/learn-sun.jpg";
import calmImg from "@/assets/learn-calm.jpg";
import heroImg from "@/assets/hero-skin.jpg";
import type { Lang } from "./i18n";

export type Article = {
  id: string;
  image: string;
  minutes: number;
  title: Record<Lang, string>;
  teaser: Record<Lang, string>;
  body: Record<Lang, string[]>;
};

export const articles: Article[] = [
  {
    id: "understanding",
    image: heroImg,
    minutes: 4,
    title: { en: "Understanding rosacea", de: "Rosazea verstehen" },
    teaser: {
      en: "What redness-prone skin is, and what it isn't.",
      de: "Was zu Rötung neigende Haut ist – und was nicht.",
    },
    body: {
      en: [
        "Rosacea is a common, long-term skin condition that usually shows up on the central face: cheeks, nose, chin and forehead. It often begins as flushing that fades, and over time can settle into more lasting redness.",
        "It behaves in cycles. Calm weeks and flare weeks are both normal, which is exactly why tracking over time is more useful than judging a single day.",
        "Only a dermatologist can confirm rosacea. Rosea helps you notice what your skin is doing, so a conversation with a professional starts from real information.",
      ],
      de: [
        "Rosazea ist eine häufige, langanhaltende Hauterkrankung, die meist die Gesichtsmitte betrifft: Wangen, Nase, Kinn und Stirn. Oft beginnt sie mit flüchtigen Rötungen, die mit der Zeit bleiben können.",
        "Sie verläuft in Phasen. Ruhige Wochen und Schübe sind beide normal – deshalb sagt der Verlauf mehr aus als ein einzelner Tag.",
        "Nur Dermatolog:innen können Rosazea feststellen. Rosea hilft dir zu beobachten, damit dein Gespräch auf echten Beobachtungen basiert.",
      ],
    },
  },
  {
    id: "triggers",
    image: sunImg,
    minutes: 3,
    title: { en: "Common rosacea triggers", de: "Häufige Auslöser" },
    teaser: {
      en: "Heat, sun, stress, alcohol — and how to find yours.",
      de: "Hitze, Sonne, Stress, Alkohol – und wie du deine findest.",
    },
    body: {
      en: [
        "The most commonly reported triggers are sun, heat, cold wind, stress, alcohol, spicy food, hot drinks, intense exercise and harsh skincare.",
        "Triggers are personal. Something that flushes one person's skin may do nothing to yours, so the goal is not to avoid everything — it's to learn your own short list.",
        "Log a check-in most days for a few weeks. Patterns appear far more clearly across 30 days than across three.",
      ],
      de: [
        "Am häufigsten genannt werden Sonne, Hitze, kalter Wind, Stress, Alkohol, scharfes Essen, heiße Getränke, intensiver Sport und aggressive Pflege.",
        "Auslöser sind individuell. Was die Haut einer Person rötet, lässt deine vielleicht völlig kalt – es geht um deine eigene kurze Liste.",
        "Mach an den meisten Tagen ein Check-in. Über 30 Tage zeigen sich Muster viel klarer als über drei.",
      ],
    },
  },
  {
    id: "skincare",
    image: skincareImg,
    minutes: 4,
    title: { en: "Rosacea-friendly skincare", de: "Pflege für gerötete Haut" },
    teaser: {
      en: "Short routines, gentle textures, fewer surprises.",
      de: "Kurze Routinen, sanfte Texturen, weniger Überraschungen.",
    },
    body: {
      en: [
        "A calm routine usually means three steps: a gentle non-foaming cleanser, a fragrance-free moisturiser with ceramides or glycerin, and broad-spectrum SPF every morning.",
        "Introduce one new product at a time and give it two to four weeks. That way, if your skin reacts, you know what caused it.",
        "Skip scrubs, strong acids, alcohol-heavy toners and very hot water while your skin feels reactive.",
      ],
      de: [
        "Eine ruhige Routine hat meist drei Schritte: sanfte, nicht schäumende Reinigung, parfümfreie Feuchtigkeitspflege mit Ceramiden oder Glycerin und morgens Breitband-Sonnenschutz.",
        "Führe neue Produkte einzeln ein und gib ihnen zwei bis vier Wochen. So weißt du bei einer Reaktion, woran es lag.",
        "Verzichte auf Peelings, starke Säuren, alkoholhaltige Tonics und sehr heißes Wasser, solange die Haut gereizt ist.",
      ],
    },
  },
  {
    id: "sun",
    image: sunImg,
    minutes: 3,
    title: { en: "Sun protection", de: "Sonnenschutz" },
    teaser: {
      en: "The single habit most people notice a difference from.",
      de: "Die eine Gewohnheit, die viele deutlich spüren.",
    },
    body: {
      en: [
        "Sun is the most frequently reported trigger of all. Daily broad-spectrum SPF 30 or higher is the habit most people with redness-prone skin say helped them most.",
        "Mineral filters (zinc oxide, titanium dioxide) suit sensitive skin well. Tinted versions also soften the look of redness.",
        "Add shade, a hat and sunglasses on bright days — sunscreen alone isn't the whole story.",
      ],
      de: [
        "Sonne ist der am häufigsten genannte Auslöser. Täglicher Breitbandschutz mit LSF 30 oder höher hilft vielen am spürbarsten.",
        "Mineralische Filter (Zinkoxid, Titandioxid) sind für empfindliche Haut gut verträglich. Getönte Varianten kaschieren Rötung zusätzlich.",
        "An hellen Tagen zusätzlich Schatten, Hut und Sonnenbrille – Sonnencreme allein reicht nicht.",
      ],
    },
  },
  {
    id: "makeup",
    image: skincareImg,
    minutes: 3,
    title: { en: "Makeup and rosacea", de: "Make-up und Rosazea" },
    teaser: {
      en: "Colour theory, gentle formulas, easy removal.",
      de: "Farbenlehre, sanfte Formeln, leichtes Abnehmen.",
    },
    body: {
      en: [
        "A green-tinted primer neutralises redness optically, then a light, fragrance-free foundation evens things out without heaviness.",
        "Cream textures usually feel kinder than powders on dry, reactive skin.",
        "Remove makeup with a gentle balm or micellar water rather than rubbing with cleansing wipes.",
      ],
      de: [
        "Ein grün getönter Primer neutralisiert Rötung optisch, danach gleicht eine leichte, parfümfreie Foundation aus – ohne Schwere.",
        "Cremige Texturen sind auf trockener, reaktiver Haut meist angenehmer als Puder.",
        "Nimm Make-up mit einem sanften Balm oder Mizellenwasser ab, statt mit Tüchern zu reiben.",
      ],
    },
  },
  {
    id: "stress",
    image: calmImg,
    minutes: 3,
    title: { en: "Stress and flushing", de: "Stress und Flushing" },
    teaser: {
      en: "Why a hard week can show up on your face.",
      de: "Warum eine harte Woche im Gesicht sichtbar wird.",
    },
    body: {
      en: [
        "Stress widens blood vessels near the skin's surface, which is why tense days and flushed cheeks so often arrive together.",
        "Small, repeatable things help more than big resolutions: slow breathing, a walk, cooler rooms, protected sleep.",
        "If your check-ins keep pairing stress with higher scores, that's a pattern worth mentioning at your next appointment.",
      ],
      de: [
        "Stress weitet die Blutgefäße nahe der Hautoberfläche – deshalb treten angespannte Tage und gerötete Wangen oft gemeinsam auf.",
        "Kleine, wiederholbare Dinge helfen mehr als große Vorsätze: ruhiges Atmen, ein Spaziergang, kühlere Räume, geschützter Schlaf.",
        "Wenn deine Check-ins Stress wiederholt mit höheren Werten zeigen, lohnt es sich, das beim nächsten Termin anzusprechen.",
      ],
    },
  },
  {
    id: "dermatologist",
    image: calmImg,
    minutes: 3,
    title: { en: "When to see a dermatologist", de: "Wann zur Hautärztin" },
    teaser: {
      en: "Signs it's time for professional care.",
      de: "Anzeichen für professionelle Hilfe.",
    },
    body: {
      en: [
        "Book an appointment if redness is persistent, if you notice bumps or pustules, if your eyes feel gritty or irritated, or if your skin is affecting how you feel day to day.",
        "Bring your Rosea progress view. Dates, scores and a photo timeline give a far clearer picture than memory.",
        "Effective prescription treatments exist. Rosea is a companion for tracking, never a replacement for medical care.",
      ],
      de: [
        "Vereinbare einen Termin, wenn die Rötung bleibt, Pusteln auftreten, die Augen brennen oder deine Haut dein Wohlbefinden belastet.",
        "Nimm deinen Rosea-Verlauf mit. Daten, Werte und Fotos sagen mehr als Erinnerung.",
        "Es gibt wirksame verschreibungspflichtige Behandlungen. Rosea begleitet dich beim Beobachten, ersetzt aber keine medizinische Versorgung.",
      ],
    },
  },
];
