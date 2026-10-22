import type { Entry, TriggerKey } from "./types";
import { contentLang, type ContentLang, type Lang } from "./i18n";

const TRIGGER_LABEL: Record<ContentLang, Partial<Record<TriggerKey, string>>> = {
  en: {
    sun: "sun exposure",
    heat: "heat",
    cold: "cold",
    stress: "stress",
    exercise: "exercise",
    alcohol: "alcohol",
    spicy: "spicy food",
    hotDrinks: "hot drinks",
    newSkincare: "new skincare",
    makeup: "makeup",
    cycle: "your cycle",
    poorSleep: "poor sleep",
    other: "other factors",
  },
  de: {
    sun: "Sonne",
    heat: "Hitze",
    cold: "Kälte",
    stress: "Stress",
    exercise: "Sport",
    alcohol: "Alkohol",
    spicy: "scharfes Essen",
    hotDrinks: "heiße Getränke",
    newSkincare: "neue Pflege",
    makeup: "Make-up",
    cycle: "deinen Zyklus",
    poorSleep: "wenig Schlaf",
    other: "andere Faktoren",
  },
};

export function buildInsights(entries: Entry[], lang: Lang): string[] {
  if (entries.length < 4) return [];
  const insights: string[] = [];
  const overall = entries.reduce((s, e) => s + e.analysis.score, 0) / entries.length;

  // trigger correlations
  const scored: { trigger: TriggerKey; diff: number; count: number }[] = [];
  const triggers = new Set<TriggerKey>(entries.flatMap((e) => e.triggers));
  for (const trigger of triggers) {
    const withT = entries.filter((e) => e.triggers.includes(trigger));
    if (withT.length < 3) continue;
    const avg = withT.reduce((s, e) => s + e.analysis.score, 0) / withT.length;
    scored.push({ trigger, diff: avg - overall, count: withT.length });
  }
  scored.sort((a, b) => b.diff - a.diff);

  const top = scored[0];
  if (top && top.diff > 3) {
    const label = TRIGGER_LABEL[contentLang(lang)][top.trigger] ?? top.trigger;
    insights.push(
      lang === "de"
        ? `Höhere Rötungswerte treten häufig an Tagen auf, an denen du ${label} notierst (${Math.round(top.diff)} Punkte über deinem Durchschnitt).`
        : `Higher redness often appears on days when you report ${label} (about ${Math.round(top.diff)} points above your average).`,
    );
  }

  const calmest = scored[scored.length - 1];
  if (calmest && calmest.diff < -3 && calmest.trigger !== top?.trigger) {
    const label = TRIGGER_LABEL[contentLang(lang)][calmest.trigger] ?? calmest.trigger;
    insights.push(
      lang === "de"
        ? `An Tagen mit ${label} liegen deine Werte eher unter deinem Durchschnitt.`
        : `On days you log ${label}, your scores tend to sit below your average.`,
    );
  }

  // trend
  const half = Math.floor(entries.length / 2);
  const first = entries.slice(0, half);
  const second = entries.slice(half);
  if (first.length && second.length) {
    const a = first.reduce((s, e) => s + e.analysis.score, 0) / first.length;
    const b = second.reduce((s, e) => s + e.analysis.score, 0) / second.length;
    const delta = Math.round(b - a);
    if (Math.abs(delta) >= 2) {
      insights.push(
        delta < 0
          ? lang === "de"
            ? `Dein durchschnittlicher Rötungswert ist in diesem Zeitraum um ${Math.abs(delta)} Punkte gesunken.`
            : `Your average redness score has decreased by ${Math.abs(delta)} points over this period.`
          : lang === "de"
            ? `Dein durchschnittlicher Rötungswert ist in diesem Zeitraum um ${delta} Punkte gestiegen.`
            : `Your average redness score has increased by ${delta} points over this period.`,
      );
    }
  }

  // consistency
  const withCheckin = entries.filter((e) => e.triggers.length || e.feeling).length;
  if (withCheckin >= entries.length * 0.6) {
    insights.push(
      lang === "de"
        ? `Du hast bei ${withCheckin} von ${entries.length} Analysen ein Check-in ausgefüllt – dadurch werden die Muster genauer.`
        : `You completed a check-in on ${withCheckin} of ${entries.length} scans, which makes these patterns more reliable.`,
    );
  }

  return insights.slice(0, 4);
}
