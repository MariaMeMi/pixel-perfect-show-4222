import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Context, ReactNode } from "react";
import { loadProfile, saveProfile } from "./storage";

export type Lang = "en" | "de";

/**
 * Flat translation dictionary. English is the source of truth; German is the
 * first additional locale. Missing keys fall back to English, so new languages
 * can be added incrementally by dropping another map in here.
 */
const en = {
  "app.name": "Rose AI",
  "app.tagline": "Your everyday skin companion for rosacea",

  "nav.home": "Home",
  "nav.analyze": "Analyze",
  "nav.routine": "Routine",
  "nav.progress": "Progress",
  "nav.learn": "Learn",
  "nav.profile": "Profile",

  "greeting.morning": "Good morning",
  "greeting.afternoon": "Good afternoon",
  "greeting.evening": "Good evening",
  "home.question": "How is your skin feeling today?",
  "home.cta": "Rosacea AI",
  "home.today": "Today's redness",
  "home.trend": "Recent trend",
  "home.streak": "Current streak",
  "home.days": "days",
  "home.noScan": "No scan yet today",
  "home.recentTriggers": "Possible recent triggers",
  "home.recentTriggersNote": "From your check-ins over the past week.",
  "home.noTriggers": "No triggers logged this week.",
  "home.lastScan": "Last scan",
  "home.tipTitle": "Gentle reminder",
  "home.tip": "Simple and consistent beats new and exciting. Cleanse gently, moisturise, protect.",

  "score.calm": "Calm skin",
  "score.mild": "Mild visible redness",
  "score.moderate": "Moderate visible redness",
  "score.high": "High visible redness",

  "analyze.title": "Rosacea AI",
  "analyze.subtitle": "A clear, even photo gives the most useful reading.",
  "analyze.tip1": "Take a clear photo in natural light",
  "analyze.tip2": "No makeup if possible",
  "analyze.tip3": "Keep your face centered",
  "analyze.takePhoto": "Take photo",
  "analyze.uploadPhoto": "Upload photo",
  "analyze.retake": "Choose another photo",
  "analyze.analyze": "Analyze my skin",
  "analyze.analyzing": "Analyzing visible redness…",
  "analyze.analyzingNote": "This takes a few seconds.",
  "analyze.privacy": "Your photo stays on this device. It is sent for analysis only and never stored by us.",
  "analyze.error": "We couldn't analyze that photo. Please try again.",
  "analyze.shutter": "Take photo",
  "analyze.closeCamera": "Close camera",
  "analyze.cameraError": "We couldn't access your camera. Check your browser permission or upload a photo instead.",
  "analyze.startingCamera": "Starting camera…",

  "results.title": "Your skin today",
  "results.score": "Redness score",
  "results.areas": "Where redness shows most",
  "results.intensity": "Redness intensity",
  "results.irritation": "Visible irritation",
  "results.change": "Change from previous scan",
  "results.higher": "Redness appears {v}% higher than your recent baseline.",
  "results.lower": "Redness appears {v}% lower than your recent baseline.",
  "results.same": "Redness is in line with your recent baseline.",
  "results.firstScan": "This is your first scan — it becomes your starting baseline.",
  "results.observations": "What we can see",
  "results.contributors": "Possible contributors",
  "results.contributorsNote": "These are common factors, not confirmed causes.",
  "results.actions": "What you can do today",
  "results.care.title": "Care options people often discuss",
  "results.care.light": "Light & laser (BBL, V-Beam)",
  "results.care.lightBody": "Light-based treatments clinics commonly discuss for persistent redness.",
  "results.care.creams": "Creams & prescriptions",
  "results.care.creamsBody": "From gentle drugstore formulas to prescription creams a dermatologist may consider.",
  "results.care.doctor": "Seeing a dermatologist",
  "results.care.doctorBody": "Persistent redness deserves a professional look — your history travels with you.",
  "results.care.note": "General information only, not advice. What's right for you is a decision to make with a professional.",
  "results.care.link": "Read more in Learn",
  "results.disclaimer": "This information is educational and isn't a medical diagnosis.",
  "results.save": "Save analysis",
  "results.saved": "Analysis saved",

  "region.forehead": "Forehead",
  "region.nose": "Nose",
  "region.leftCheek": "Left cheek",
  "region.rightCheek": "Right cheek",
  "region.chin": "Chin",

  "checkin.title": "Daily check-in",
  "checkin.feel": "How does your skin feel?",
  "checkin.affect": "What might have affected your skin today?",
  "checkin.multi": "Select all that apply",
  "checkin.finish": "Finish check-in",
  "checkin.skip": "Skip for now",

  "feeling.normal": "Normal",
  "feeling.warm": "Warm",
  "feeling.burning": "Burning",
  "feeling.itchy": "Itchy",
  "feeling.dry": "Dry",
  "feeling.sensitive": "Sensitive",

  "trigger.sun": "Sun",
  "trigger.heat": "Heat",
  "trigger.cold": "Cold",
  "trigger.stress": "Stress",
  "trigger.exercise": "Exercise",
  "trigger.alcohol": "Alcohol",
  "trigger.spicy": "Spicy food",
  "trigger.hotDrinks": "Hot drinks",
  "trigger.newSkincare": "New skincare",
  "trigger.makeup": "Makeup",
  "trigger.cycle": "Menstrual cycle",
  "trigger.poorSleep": "Poor sleep",
  "trigger.other": "Other",

  "progress.title": "Progress",
  "progress.subtitle": "Redness over time, gently tracked.",
  "progress.7": "7 days",
  "progress.30": "30 days",
  "progress.90": "90 days",
  "progress.average": "Average score",
  "progress.scans": "Scans",
  "progress.best": "Calmest day",
  "progress.patterns": "Your patterns",
  "progress.patternsNote": "Patterns show what appears together — not what caused what.",
  "progress.timeline": "Photo timeline",
  "progress.compare": "Compare photos",
  "progress.compareNote": "Drag the slider to compare two saved photos.",
  "progress.noPhotos": "No saved photos yet. Photos you keep will appear here.",
  "progress.empty": "No scans in this period yet.",
  "progress.before": "Earlier",
  "progress.after": "Latest",

  "learn.title": "Learn",
  "learn.subtitle": "Short, calm reads about redness-prone skin.",
  "learn.readTime": "min read",

  "profile.title": "Profile",
  "profile.skin": "Skin profile",
  "profile.name": "Name",
  "profile.skinType": "Skin type",
  "profile.sensitivity": "Sensitivity",
  "profile.knownTriggers": "Known triggers",
  "profile.routine": "Current skincare routine",
  "profile.products": "Products",
  "profile.medications": "Medications",
  "profile.notifications": "Notification settings",
  "profile.reminders": "Daily check-in reminder",
  "profile.photoPrivacy": "Photo privacy",
  "profile.retainPhotos": "Keep photos with my scans",
  "profile.retainNote": "When off, new scans save your score only — never the image.",
  "profile.deletePhotos": "Delete all photos",
  "profile.dataPrivacy": "Data & privacy",
  "profile.dataNote": "Everything lives on this device. Your photos are never shared without your permission.",
  "profile.deleteHistory": "Delete all history",
  "profile.language": "Language",
  "profile.country": "Country",
  "profile.saved": "Saved",
  "profile.confirmPhotos": "Delete every saved photo? This can't be undone.",
  "profile.confirmHistory": "Delete your full history? This can't be undone.",
  "profile.account": "Account",
  "profile.signedInAs": "Signed in as",
  "profile.signOut": "Sign out",
  "profile.deleteAccount": "Delete my account",
  "profile.confirmAccount": "Permanently delete your account and all server-side data? This can't be undone.",
  "profile.startOver": "Start over",
  "profile.startOverDesc": "Erases your answers, photos and history on this device and begins onboarding again.",
  "profile.confirmStartOver": "Start over from the beginning? Your answers, photos and history on this device will be erased.",
  "profile.accountDeleted": "Your account has been deleted.",
  "profile.medicalNote": "Rose AI is a wellness and skin-tracking assistant. It doesn't diagnose rosacea or any other condition.",

  "common.cancel": "Cancel",
  "common.back": "Back",
  "common.delete": "Delete",
  "common.save": "Save",
} as const;

export type TKey = keyof typeof en;

const de: Partial<Record<TKey, string>> = {
  "app.tagline": "Deine tägliche Hautbegleitung bei Rosazea",
  "nav.home": "Start",
  "nav.analyze": "Analyse",
  "nav.routine": "Routine",
  "nav.progress": "Verlauf",
  "nav.learn": "Wissen",
  "nav.profile": "Profil",

  "greeting.morning": "Guten Morgen",
  "greeting.afternoon": "Guten Tag",
  "greeting.evening": "Guten Abend",
  "home.question": "Wie fühlt sich deine Haut heute an?",
  "home.cta": "Rosacea AI",
  "home.today": "Rötung heute",
  "home.trend": "Aktueller Trend",
  "home.streak": "Aktuelle Serie",
  "home.days": "Tage",
  "home.noScan": "Heute noch keine Analyse",
  "home.recentTriggers": "Mögliche Auslöser der letzten Tage",
  "home.recentTriggersNote": "Aus deinen Check-ins der letzten Woche.",
  "home.noTriggers": "Diese Woche keine Auslöser notiert.",
  "home.lastScan": "Letzte Analyse",
  "home.tipTitle": "Sanfte Erinnerung",
  "home.tip": "Einfach und konstant wirkt besser als neu und aufregend. Sanft reinigen, pflegen, schützen.",

  "score.calm": "Ruhige Haut",
  "score.mild": "Leichte sichtbare Rötung",
  "score.moderate": "Mittlere sichtbare Rötung",
  "score.high": "Starke sichtbare Rötung",

  "analyze.title": "Rosacea AI",
  "analyze.subtitle": "Ein klares, gleichmäßiges Foto liefert das beste Ergebnis.",
  "analyze.tip1": "Mach ein klares Foto bei Tageslicht",
  "analyze.tip2": "Wenn möglich ohne Make-up",
  "analyze.tip3": "Halte dein Gesicht mittig",
  "analyze.takePhoto": "Foto aufnehmen",
  "analyze.uploadPhoto": "Foto hochladen",
  "analyze.retake": "Anderes Foto wählen",
  "analyze.analyze": "Haut analysieren",
  "analyze.analyzing": "Sichtbare Rötung wird analysiert…",
  "analyze.analyzingNote": "Das dauert nur wenige Sekunden.",
  "analyze.privacy":
    "Dein Foto bleibt auf diesem Gerät. Es wird nur zur Analyse gesendet und von uns nicht gespeichert.",
  "analyze.error": "Dieses Foto konnte nicht analysiert werden. Bitte versuche es erneut.",
  "analyze.shutter": "Foto aufnehmen",
  "analyze.closeCamera": "Kamera schließen",
  "analyze.cameraError":
    "Wir konnten nicht auf deine Kamera zugreifen. Prüfe die Browser-Berechtigung oder lade stattdessen ein Foto hoch.",
  "analyze.startingCamera": "Kamera wird gestartet…",

  "results.title": "Deine Haut heute",
  "results.score": "Rötungswert",
  "results.areas": "Wo die Rötung am stärksten ist",
  "results.intensity": "Intensität der Rötung",
  "results.irritation": "Sichtbare Reizung",
  "results.change": "Veränderung zur letzten Analyse",
  "results.higher": "Die Rötung wirkt {v}% stärker als dein jüngster Durchschnitt.",
  "results.lower": "Die Rötung wirkt {v}% schwächer als dein jüngster Durchschnitt.",
  "results.same": "Die Rötung entspricht deinem jüngsten Durchschnitt.",
  "results.firstScan": "Das ist deine erste Analyse – sie wird dein Ausgangswert.",
  "results.observations": "Das ist sichtbar",
  "results.contributors": "Mögliche Einflüsse",
  "results.contributorsNote": "Das sind häufige Faktoren, keine bestätigten Ursachen.",
  "results.actions": "Was du heute tun kannst",
  "results.care.title": "Behandlungsoptionen, über die oft gesprochen wird",
  "results.care.light": "Licht & Laser (BBL, V-Beam)",
  "results.care.lightBody": "Lichtbasierte Behandlungen, die Kliniken oft bei anhaltender Rötung besprechen.",
  "results.care.creams": "Cremes & Rezepte",
  "results.care.creamsBody": "Von sanften Apothekenprodukten bis zu rezeptpflichtigen Cremes.",
  "results.care.doctor": "Zur Hautärztin / zum Hautarzt",
  "results.care.doctorBody": "Anhaltende Rötung verdient einen professionellen Blick – dein Verlauf reist mit.",
  "results.care.note": "Nur allgemeine Informationen, keine Beratung. Was für dich passt, entscheidest du mit Fachleuten.",
  "results.care.link": "Mehr im Bereich Wissen",
  "results.disclaimer": "Diese Informationen dienen der Aufklärung und sind keine medizinische Diagnose.",
  "results.save": "Analyse speichern",
  "results.saved": "Analyse gespeichert",

  "region.forehead": "Stirn",
  "region.nose": "Nase",
  "region.leftCheek": "Linke Wange",
  "region.rightCheek": "Rechte Wange",
  "region.chin": "Kinn",

  "checkin.title": "Tägliches Check-in",
  "checkin.feel": "Wie fühlt sich deine Haut an?",
  "checkin.affect": "Was könnte deine Haut heute beeinflusst haben?",
  "checkin.multi": "Mehrfachauswahl möglich",
  "checkin.finish": "Check-in abschließen",
  "checkin.skip": "Später",

  "feeling.normal": "Normal",
  "feeling.warm": "Warm",
  "feeling.burning": "Brennend",
  "feeling.itchy": "Juckend",
  "feeling.dry": "Trocken",
  "feeling.sensitive": "Empfindlich",

  "trigger.sun": "Sonne",
  "trigger.heat": "Hitze",
  "trigger.cold": "Kälte",
  "trigger.stress": "Stress",
  "trigger.exercise": "Sport",
  "trigger.alcohol": "Alkohol",
  "trigger.spicy": "Scharfes Essen",
  "trigger.hotDrinks": "Heiße Getränke",
  "trigger.newSkincare": "Neue Pflege",
  "trigger.makeup": "Make-up",
  "trigger.cycle": "Zyklus",
  "trigger.poorSleep": "Wenig Schlaf",
  "trigger.other": "Sonstiges",

  "progress.title": "Verlauf",
  "progress.subtitle": "Rötung über die Zeit, sanft dokumentiert.",
  "progress.7": "7 Tage",
  "progress.30": "30 Tage",
  "progress.90": "90 Tage",
  "progress.average": "Durchschnitt",
  "progress.scans": "Analysen",
  "progress.best": "Ruhigster Tag",
  "progress.patterns": "Deine Muster",
  "progress.patternsNote": "Muster zeigen, was gemeinsam auftritt – nicht was etwas verursacht hat.",
  "progress.timeline": "Foto-Verlauf",
  "progress.compare": "Fotos vergleichen",
  "progress.compareNote": "Zieh den Regler, um zwei gespeicherte Fotos zu vergleichen.",
  "progress.noPhotos": "Noch keine gespeicherten Fotos. Behaltene Fotos erscheinen hier.",
  "progress.empty": "In diesem Zeitraum gibt es noch keine Analysen.",
  "progress.before": "Früher",
  "progress.after": "Aktuell",

  "learn.title": "Wissen",
  "learn.subtitle": "Kurze, ruhige Texte über zu Rötung neigende Haut.",
  "learn.readTime": "Min. Lesezeit",

  "profile.title": "Profil",
  "profile.skin": "Hautprofil",
  "profile.name": "Name",
  "profile.skinType": "Hauttyp",
  "profile.sensitivity": "Empfindlichkeit",
  "profile.knownTriggers": "Bekannte Auslöser",
  "profile.routine": "Aktuelle Pflegeroutine",
  "profile.products": "Produkte",
  "profile.medications": "Medikamente",
  "profile.notifications": "Benachrichtigungen",
  "profile.reminders": "Erinnerung ans Check-in",
  "profile.photoPrivacy": "Foto-Privatsphäre",
  "profile.retainPhotos": "Fotos zu meinen Analysen behalten",
  "profile.retainNote": "Wenn aus, wird nur dein Wert gespeichert – nie das Bild.",
  "profile.deletePhotos": "Alle Fotos löschen",
  "profile.dataPrivacy": "Daten & Privatsphäre",
  "profile.dataNote":
    "Alles bleibt auf diesem Gerät. Deine Fotos werden nie ohne deine Zustimmung geteilt.",
  "profile.deleteHistory": "Gesamten Verlauf löschen",
  "profile.language": "Sprache",
  "profile.country": "Land",
  "profile.saved": "Gespeichert",
  "profile.confirmPhotos": "Alle gespeicherten Fotos löschen? Das lässt sich nicht rückgängig machen.",
  "profile.confirmHistory": "Gesamten Verlauf löschen? Das lässt sich nicht rückgängig machen.",
  "profile.account": "Konto",
  "profile.signedInAs": "Angemeldet als",
  "profile.signOut": "Abmelden",
  "profile.deleteAccount": "Konto löschen",
  "profile.confirmAccount": "Konto und alle serverseitigen Daten endgültig löschen? Das lässt sich nicht rückgängig machen.",
  "profile.startOver": "Neu beginnen",
  "profile.startOverDesc": "Löscht deine Antworten, Fotos und den Verlauf auf diesem Gerät und startet das Onboarding erneut.",
  "profile.confirmStartOver": "Von vorne beginnen? Deine Antworten, Fotos und dein Verlauf auf diesem Gerät werden gelöscht.",
  "profile.accountDeleted": "Dein Konto wurde gelöscht.",
  "profile.medicalNote":
    "Rose AI ist eine Wellness- und Hautbegleitung. Es stellt keine Diagnose von Rosazea oder anderen Erkrankungen.",

  "common.cancel": "Abbrechen",
  "common.back": "Zurück",
  "common.delete": "Löschen",
  "common.save": "Speichern",
};

const dictionaries: Record<Lang, Partial<Record<TKey, string>>> = { en, de };

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
};

// Keep one context instance across hot reloads so the provider and consumers always match.
const g = globalThis as unknown as { __roseI18nCtx?: Context<I18nValue | null> };
const I18nContext = g.__roseI18nCtx ?? (g.__roseI18nCtx = createContext<I18nValue | null>(null));

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(loadProfile().language);
    const sync = () => setLangState(loadProfile().language);
    window.addEventListener("rosea:profile", sync);
    return () => window.removeEventListener("rosea:profile", sync);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    saveProfile({ ...loadProfile(), language: next });
  }, []);

  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>) => {
      let value = dictionaries[lang][key] ?? en[key] ?? (key as string);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.replace(`{${k}}`, String(v));
        }
      }
      return value;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
