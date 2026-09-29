import { createFileRoute, Link } from "@tanstack/react-router";
import { track } from "@/lib/experiment";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { buildInsights } from "@/lib/insights";
import { averageScore, deletePhoto, entriesWithinDays, loadEntries } from "@/lib/storage";
import type { Entry } from "@/lib/types";
import { RoutineCta } from "@/components/RoutineCta";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Rose AI" },
      {
        name: "description",
        content: "Your redness scores over 7, 30 and 90 days, with patterns and a photo timeline.",
      },
      { property: "og:title", content: "Progress — Rose AI" },
      {
        property: "og:description",
        content: "Follow how your skin changes over time with gentle, private tracking.",
      },
    ],
  }),
  component: ProgressPage,
});

const RANGES = [7, 30, 90] as const;

function ProgressPage() {
  const { t, lang } = useI18n();
  useEffect(() => { track("timeline_viewed", "onboarding"); }, []);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const [slider, setSlider] = useState(50);

  useEffect(() => {
    const sync = () => setEntries(loadEntries());
    sync();
    window.addEventListener("rosea:entries", sync);
    return () => window.removeEventListener("rosea:entries", sync);
  }, []);

  const scoped = useMemo(() => entriesWithinDays(entries, range), [entries, range]);
  const data = useMemo(
    () =>
      scoped.map((e) => ({
        date: new Date(e.date).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", {
          day: "numeric",
          month: "short",
        }),
        score: e.analysis.score,
      })),
    [scoped, lang],
  );
  const insights = useMemo(() => buildInsights(scoped, lang), [scoped, lang]);
  const photos = useMemo(() => entries.filter((e) => e.photo), [entries]);
  const best = scoped.length ? Math.min(...scoped.map((e) => e.analysis.score)) : 0;

  const first = photos[0];
  const last = photos[photos.length - 1];

  return (
    <div className="animate-rise space-y-7">
      <header>
        <p className="eyebrow">{t("nav.progress")}</p>
        <h1 className="mt-2 text-[2rem] leading-tight text-foreground">{t("progress.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("progress.subtitle")}</p>
      </header>

      <RoutineCta />
      {entries.length >= 3 ? <JourneyCta lang={lang} /> : null}

      <div className="flex gap-2 rounded-full bg-secondary p-1">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 rounded-full py-2 text-sm transition-colors ${
              range === r ? "bg-card text-foreground shadow-[var(--shadow-soft)]" : "text-muted-foreground"
            }`}
          >
            {t(`progress.${r}` as const)}
          </button>
        ))}
      </div>

      <section className="surface p-5">
        {data.length ? (
          <>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div>
                <p className="eyebrow">{t("progress.average")}</p>
                <p className="mt-1 font-display text-2xl text-foreground">{averageScore(scoped)}</p>
              </div>
              <div>
                <p className="eyebrow">{t("progress.scans")}</p>
                <p className="mt-1 font-display text-2xl text-foreground">{scoped.length}</p>
              </div>
              <div>
                <p className="eyebrow">{t("progress.best")}</p>
                <p className="mt-1 font-display text-2xl text-foreground">{best}</p>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 6, right: 4, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roseaArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#cf7b74" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#cf7b74" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={28}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#c26a66"
                    strokeWidth={2}
                    fill="url(#roseaArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("progress.empty")}</p>
        )}
      </section>

      {insights.length ? (
        <section>
          <h2 className="text-lg text-foreground">{t("progress.patterns")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("progress.patternsNote")}</p>
          <ul className="mt-3 space-y-2">
            {insights.map((i) => (
              <li key={i} className="surface flex gap-3 p-4 text-sm leading-relaxed text-secondary-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.6} />
                {i}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg text-foreground">{t("progress.timeline")}</h2>
        {photos.length ? (
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
            {photos
              .slice()
              .reverse()
              .map((e) => (
                <figure key={e.id} className="w-28 shrink-0">
                  <div className="relative overflow-hidden rounded-2xl border border-border">
                    <img src={e.photo} alt="" className="h-36 w-28 object-cover" loading="lazy" />
                    <button
                      onClick={() => deletePhoto(e.id)}
                      aria-label={t("common.delete")}
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-card/85 text-muted-foreground backdrop-blur"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                    </button>
                  </div>
                  <figcaption className="mt-1.5 text-[0.7rem] text-muted-foreground">
                    {new Date(e.date).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {e.analysis.score}
                  </figcaption>
                </figure>
              ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">{t("progress.noPhotos")}</p>
        )}
      </section>

      {first && last && first.id !== last.id ? (
        <section className="surface p-5">
          <h2 className="text-lg text-foreground">{t("progress.compare")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("progress.compareNote")}</p>
          <div className="relative mt-4 aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border">
            <img src={last.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${slider}%` }}
            >
              <img
                src={first.photo}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ width: `${(100 / Math.max(slider, 1)) * 100}%`, maxWidth: "none" }}
              />
            </div>
            <span className="absolute inset-y-0 w-0.5 bg-card/90" style={{ left: `${slider}%` }} />
            <span className="absolute bottom-2 left-2 rounded-full bg-card/85 px-2.5 py-1 text-[0.65rem] text-foreground backdrop-blur">
              {t("progress.before")}
            </span>
            <span className="absolute bottom-2 right-2 rounded-full bg-card/85 px-2.5 py-1 text-[0.65rem] text-foreground backdrop-blur">
              {t("progress.after")}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={slider}
            onChange={(e) => setSlider(Number(e.target.value))}
            className="mt-4 w-full accent-[oklch(0.63_0.13_16)]"
            aria-label={t("progress.compare")}
          />
        </section>
      ) : null}
    </div>
  );
}

function JourneyCta({ lang }: { lang: string }) {
  const de = lang === "de";
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("rose.journey.celebrate")) {
      sessionStorage.removeItem("rose.journey.celebrate");
      setCelebrate(true);
    }
    track("skin_journey_cta_viewed", "skin_journey");
  }, []);
  return (
    <Link to="/journey" className="surface-lift gradient-dawn block p-5 active:scale-[0.99] transition-transform">
      {celebrate ? (
        <>
          <p className="font-display text-2xl text-foreground">
            {de ? "Deine erste Hautzeitleiste ist fertig 🎉" : "You’ve created your first skin timeline 🎉"}
          </p>
          <p className="mt-1 text-sm text-secondary-foreground">
            {de
              ? "Du hast jetzt genug Check-ins, um auf deine Reise zurückzublicken."
              : "You now have enough check-ins to look back at your journey."}
          </p>
        </>
      ) : null}
      <span className="mt-3 inline-flex items-center gap-2 rounded-full gradient-rose px-4 py-2 text-sm text-primary-foreground">
        {celebrate
          ? de ? "Fortschrittskarte erstellen" : "Create my progress card"
          : de ? "Meine Hautreise erstellen 🌹" : "Create My Skin Journey 🌹"}
      </span>
    </Link>
  );
}
