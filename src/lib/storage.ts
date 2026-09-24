import type { Analysis, Entry, Profile, RegionKey, TriggerKey } from "./types";

const ENTRIES_KEY = "rosea.entries.v1";
const PROFILE_KEY = "rosea.profile.v1";

export const defaultProfile: Profile = {
  name: "",
  skinType: "combination",
  sensitivity: "high",
  knownTriggers: ["sun", "heat", "stress"],
  routine: "Gentle cream cleanser (PM), fragrance-free moisturiser, SPF 50 every morning.",
  products: "Ceramide moisturiser, mineral SPF 50, azelaic acid 10% (2x per week)",
  medications: "",
  remindersEnabled: true,
  retainPhotos: true,
  language: "en",
  country: "US",
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function labelForScore(score: number): "calm" | "mild" | "moderate" | "high" {
  if (score < 25) return "calm";
  if (score < 45) return "mild";
  if (score < 70) return "moderate";
  return "high";
}

/* ---------- seed data ---------- */

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const SEED_TRIGGERS: TriggerKey[] = [
  "sun",
  "heat",
  "stress",
  "alcohol",
  "spicy",
  "exercise",
  "hotDrinks",
  "poorSleep",
];

function buildSeed(): Entry[] {
  const rnd = seededRandom(42);
  const entries: Entry[] = [];
  const days = 76;
  for (let i = days; i >= 1; i--) {
    if (i % 3 === 2 && rnd() > 0.55) continue; // some missed days
    const date = new Date();
    date.setHours(8, 30, 0, 0);
    date.setDate(date.getDate() - i);

    const triggers: TriggerKey[] = [];
    for (const t of SEED_TRIGGERS) {
      if (rnd() > 0.82) triggers.push(t);
    }

    const trend = 62 - (days - i) * 0.12; // slow improvement
    const heatBump = triggers.includes("heat") || triggers.includes("sun") ? 11 : 0;
    const stressBump = triggers.includes("stress") ? 6 : 0;
    const score = Math.max(
      12,
      Math.min(92, Math.round(trend + heatBump + stressBump + (rnd() - 0.5) * 14)),
    );

    const regions: Record<RegionKey, number> = {
      leftCheek: Math.min(100, Math.round(score + (rnd() - 0.3) * 18)),
      rightCheek: Math.min(100, Math.round(score + (rnd() - 0.35) * 18)),
      nose: Math.min(100, Math.round(score + (rnd() - 0.2) * 16)),
      forehead: Math.max(5, Math.round(score - 14 + rnd() * 10)),
      chin: Math.max(5, Math.round(score - 18 + rnd() * 12)),
    };

    entries.push({
      id: `seed-${i}`,
      date: date.toISOString(),
      triggers,
      feeling: score > 60 ? "warm" : score > 40 ? "sensitive" : "normal",
      analysis: {
        score,
        irritation: Math.max(4, Math.round(score * 0.72 + (rnd() - 0.5) * 12)),
        regions,
        summary: "Visible redness concentrated across the central face.",
        observations: [
          "Diffuse warmth across both cheeks",
          "Slight shine and flushing around the nose",
        ],
        contributors: triggers.length ? [] : [],
        tips: [],
      },
    });
  }
  return entries;
}

/* ---------- reads / writes ---------- */

export function loadEntries(): Entry[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(ENTRIES_KEY);
  if (!raw) {
    const seed = buildSeed();
    window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw) as Entry[];
  } catch {
    return [];
  }
}

export function saveEntries(entries: Entry[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("rosea:entries"));
}

export function addEntry(entry: Entry) {
  const entries = loadEntries();
  entries.push(entry);
  entries.sort((a, b) => a.date.localeCompare(b.date));
  saveEntries(entries);
}

export function updateEntry(id: string, patch: Partial<Entry>) {
  const entries = loadEntries().map((e) => (e.id === id ? { ...e, ...patch } : e));
  saveEntries(entries);
}

export function deleteEntry(id: string) {
  saveEntries(loadEntries().filter((e) => e.id !== id));
}

export function deletePhoto(id: string) {
  const entries = loadEntries().map((e) => (e.id === id ? { ...e, photo: undefined } : e));
  saveEntries(entries);
}

export function deleteAllPhotos() {
  saveEntries(loadEntries().map((e) => ({ ...e, photo: undefined })));
}

export function clearHistory() {
  if (!isBrowser()) return;
  window.localStorage.setItem(ENTRIES_KEY, JSON.stringify([]));
  window.dispatchEvent(new Event("rosea:entries"));
}

export function loadProfile(): Profile {
  if (!isBrowser()) return defaultProfile;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return defaultProfile;
  try {
    return { ...defaultProfile, ...(JSON.parse(raw) as Partial<Profile>) };
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(profile: Profile) {
  if (!isBrowser()) return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event("rosea:profile"));
}

/* ---------- derived ---------- */

export function averageScore(entries: Entry[]) {
  if (!entries.length) return 0;
  return Math.round(entries.reduce((sum, e) => sum + e.analysis.score, 0) / entries.length);
}

export function baselineScore(entries: Entry[], excludeId?: string) {
  const recent = entries
    .filter((e) => e.id !== excludeId)
    .slice(-7);
  return averageScore(recent);
}

export function currentStreak(entries: Entry[]) {
  if (!entries.length) return 0;
  const days = new Set(entries.map((e) => e.date.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  // allow today to be missing without breaking the streak
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function entriesWithinDays(entries: Entry[], days: number) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return entries.filter((e) => new Date(e.date).getTime() >= cutoff);
}

export function latestEntry(entries: Entry[]) {
  return entries.length ? entries[entries.length - 1] : undefined;
}

export function analysisFallback(): Analysis {
  return {
    score: 0,
    irritation: 0,
    regions: { forehead: 0, nose: 0, leftCheek: 0, rightCheek: 0, chin: 0 },
    summary: "",
    observations: [],
    contributors: [],
    tips: [],
  };
}
