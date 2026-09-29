import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { submitEmail } from "@/lib/experiment.functions";
import {
  hasProvidedEmail,
  markEmailProvided,
  referredBy,
  track,
  type Experience,
} from "@/lib/experiment";
import { useI18n } from "@/lib/i18n";

const COPY = {
  en: {
    title: "Your results are ready ✨",
    body: "Enter your email to see your results and track changes over time.",
    label: "Email address",
    cta: "See my results →",
    privacy: "We'll use your email to provide access to your results and product updates. See our",
    policy: "Privacy Policy",
    invalid: "Please enter a valid email address.",
    failed: "Something went wrong. Please try again.",
  },
  de: {
    title: "Deine Ergebnisse sind fertig ✨",
    body: "Gib deine E-Mail ein, um deine Ergebnisse zu sehen und Veränderungen zu verfolgen.",
    label: "E-Mail-Adresse",
    cta: "Ergebnisse ansehen →",
    privacy: "Wir nutzen deine E-Mail, um dir Zugang zu deinen Ergebnissen und Produkt-Updates zu geben. Siehe unsere",
    policy: "Datenschutzerklärung",
    invalid: "Bitte gib eine gültige E-Mail-Adresse ein.",
    failed: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
  },
};

export type GateResults = { score?: number; summary?: string; points?: string[] };

export function EmailGate({
  experience,
  onDone,
  results,
  defaultEmail,
}: {
  defaultEmail?: string | undefined;
  experience: Experience;
  onDone: () => void;
  results?: GateResults | undefined;
}) {
  const { lang } = useI18n();
  const c = COPY[lang === "de" ? "de" : "en"];
  const submit = useServerFn(submitEmail);
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const viewed = useRef(false);

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    track("email_gate_viewed", experience);
  }, [experience]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email().max(255).safeParse(email);
    if (!parsed.success) return setError(c.invalid);
    setBusy(true);
    setError("");
    try {
      const ref = referredBy();
      const res = await submit({
        data: {
          email: parsed.data,
          experience: experience === "botox_information" ? "botox_information" : "redness",
          referredBy: ref,
          lang: lang === "de" ? "de" : "en",
          results: results
            ? {
                score: results.score,
                summary: results.summary?.slice(0, 600),
                points: results.points?.slice(0, 6).map((p) => p.slice(0, 300)),
              }
            : undefined,
        },
      });
      if (!res.ok) throw new Error();
      const first = !hasProvidedEmail();
      markEmailProvided();
      track("email_submitted", experience);
      if (ref && first) {
        track("referral_signup", "skin_journey", ref);
        track("referred_user_signed_up", "skin_journey", ref);
      }
      onDone();
    } catch {
      setError(c.failed);
      setBusy(false);
    }
  }

  return (
    <div className="animate-rise flex min-h-[70vh] flex-col justify-center">
      <form onSubmit={onSubmit} className="surface-lift gradient-dawn space-y-5 p-7">
        <h1 className="font-display text-[2rem] leading-tight text-foreground">{c.title}</h1>
        <p className="text-sm leading-relaxed text-secondary-foreground">{c.body}</p>
        <label className="block space-y-2">
          <span className="eyebrow">{c.label}</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base text-foreground outline-none focus:border-primary"
            placeholder="you@example.com"
          />
        </label>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-60"
        >
          {c.cta}
        </button>
        <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
          {c.privacy}{" "}
          <Link to="/privacy" className="underline underline-offset-2">
            {c.policy}
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
