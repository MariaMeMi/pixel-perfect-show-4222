import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Info, Leaf, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Chip } from "@/components/Chip";
import { FaceMap } from "@/components/FaceMap";
import { ScoreRing } from "@/components/ScoreRing";
import { useI18n } from "@/lib/i18n";
import { addEntry, baselineScore, loadEntries, loadProfile } from "@/lib/storage";
import type { Analysis, Entry, FeelingKey, TriggerKey } from "@/lib/types";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Your skin today — Rose AI" },
      {
        name: "description",
        content: "See today's redness score, where it shows most and what you can do today.",
      },
      { property: "og:title", content: "Your skin today — Rose AI" },
      {
        property: "og:description",
        content: "A calm, non-diagnostic reading of today's visible facial redness.",
      },
    ],
  }),
  component: ResultsPage,
});

const FEELINGS: FeelingKey[] = ["normal", "warm", "burning", "itchy", "dry", "sensitive"];
const TRIGGERS: TriggerKey[] = [
  "sun",
  "heat",
  "cold",
  "stress",
  "exercise",
  "alcohol",
  "spicy",
  "hotDrinks",
  "newSkincare",
  "makeup",
  "cycle",
  "poorSleep",
  "other",
];

type Pending = { analysis: Analysis; photo: string; date: string };

function ResultsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [pending, setPending] = useState<Pending | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [step, setStep] = useState<"results" | "checkin">("results");
  const [feeling, setFeeling] = useState<FeelingKey | undefined>();
  const [triggers, setTriggers] = useState<TriggerKey[]>([]);

  useEffect(() => {
    const raw = window.sessionStorage.getItem("rosea.pending");
    if (!raw) {
      navigate({ to: "/analyze" });
      return;
    }
    setPending(JSON.parse(raw) as Pending);
    setEntries(loadEntries());
  }, [navigate]);

  const baseline = useMemo(() => baselineScore(entries), [entries]);

  if (!pending) return null;
  const a = pending.analysis;

  const changeText = !baseline
    ? t("results.firstScan")
    : (() => {
        const diff = Math.round(((a.score - baseline) / Math.max(1, baseline)) * 100);
        if (Math.abs(diff) < 3) return t("results.same");
        return diff > 0
          ? t("results.higher", { v: diff })
          : t("results.lower", { v: Math.abs(diff) });
      })();

  function save() {
    if (!pending) return;
    const profile = loadProfile();
    addEntry({
      id: `scan-${Date.now()}`,
      date: pending.date,
      analysis: pending.analysis,
      photo: profile.retainPhotos ? pending.photo : undefined,
      feeling,
      triggers,
    });
    window.sessionStorage.removeItem("rosea.pending");
    toast.success(t("results.saved"));
    navigate({ to: "/progress" });
  }

  if (step === "checkin") {
    return (
      <div className="animate-rise space-y-8">
        <header>
          <p className="eyebrow">{t("checkin.title")}</p>
          <h1 className="mt-2 text-[1.9rem] leading-tight text-foreground">{t("checkin.feel")}</h1>
        </header>

        <div className="flex flex-wrap gap-2">
          {FEELINGS.map((f) => (
            <Chip
              key={f}
              label={t(`feeling.${f}` as const)}
              selected={feeling === f}
              onClick={() => setFeeling(feeling === f ? undefined : f)}
            />
          ))}
        </div>

        <div>
          <h2 className="text-lg text-foreground">{t("checkin.affect")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("checkin.multi")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TRIGGERS.map((tr) => (
              <Chip
                key={tr}
                label={t(`trigger.${tr}` as const)}
                selected={triggers.includes(tr)}
                onClick={() =>
                  setTriggers((prev) =>
                    prev.includes(tr) ? prev.filter((x) => x !== tr) : [...prev, tr],
                  )
                }
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={save}
            className="w-full rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-lift)] active:scale-[0.99]"
          >
            {t("checkin.finish")}
          </button>
          <button
            onClick={save}
            className="w-full rounded-full border border-border bg-card py-4 text-sm text-muted-foreground active:scale-[0.99]"
          >
            {t("checkin.skip")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-7">
      <header className="text-center">
        <p className="eyebrow">{t("results.score")}</p>
        <h1 className="mt-2 text-[2rem] leading-tight text-foreground">{t("results.title")}</h1>
      </header>

      <div className="surface-lift gradient-dawn flex flex-col items-center gap-4 p-7">
        <ScoreRing score={a.score} />
        <p className="max-w-[18rem] text-center text-sm leading-relaxed text-secondary-foreground">
          {a.summary}
        </p>
      </div>

      <section className="surface space-y-5 p-6">
        <h2 className="text-lg text-foreground">{t("results.areas")}</h2>
        <FaceMap regions={a.regions} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="surface p-5">
          <p className="eyebrow">{t("results.intensity")}</p>
          <p className="mt-2 font-display text-3xl text-foreground">{a.score}</p>
        </div>
        <div className="surface p-5">
          <p className="eyebrow">{t("results.irritation")}</p>
          <p className="mt-2 font-display text-3xl text-foreground">{a.irritation}</p>
        </div>
      </section>

      <section className="surface flex gap-3 p-5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.7} />
        <div>
          <p className="eyebrow">{t("results.change")}</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{changeText}</p>
        </div>
      </section>

      {a.observations?.length ? (
        <section>
          <h2 className="text-lg text-foreground">{t("results.observations")}</h2>
          <ul className="mt-3 space-y-2">
            {a.observations.map((o) => (
              <li key={o} className="surface flex gap-3 p-4 text-sm text-secondary-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {o}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {a.contributors?.length ? (
        <section>
          <h2 className="text-lg text-foreground">{t("results.contributors")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("results.contributorsNote")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {a.contributors.map((c) => (
              <Chip key={c} as="span" label={c} />
            ))}
          </div>
        </section>
      ) : null}

      {a.tips?.length ? (
        <section className="surface gradient-dawn p-6">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" strokeWidth={1.7} />
            <h2 className="text-lg text-foreground">{t("results.actions")}</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {a.tips.map((tip) => (
              <li key={tip} className="flex gap-3 text-sm leading-relaxed text-secondary-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                {tip}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="surface space-y-4 p-6">
        <h2 className="text-lg text-foreground">{t("results.care.title")}</h2>
        <div className="space-y-3">
          {(
            [
              ["results.care.light", "results.care.lightBody"],
              ["results.care.creams", "results.care.creamsBody"],
              ["results.care.doctor", "results.care.doctorBody"],
            ] as const
          ).map(([title, body]) => (
            <div key={title} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <p className="text-sm leading-relaxed text-secondary-foreground">
                <span className="text-foreground">{t(title)}</span> — {t(body)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("results.care.note")}</p>
        <Link
          to="/learn"
          className="inline-block text-sm text-primary underline underline-offset-4"
        >
          {t("results.care.link")}
        </Link>
      </section>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
        {t("results.disclaimer")}
      </p>

      <button
        onClick={() => setStep("checkin")}
        className="w-full rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-lift)] active:scale-[0.99]"
      >
        {t("results.save")}
      </button>
    </div>
  );
}
