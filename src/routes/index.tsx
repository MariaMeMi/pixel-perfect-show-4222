import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Flame, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import heroImg from "@/assets/hero-skin.jpg";
import { Chip } from "@/components/Chip";
import { useI18n } from "@/lib/i18n";
import {
  averageScore,
  currentStreak,
  entriesWithinDays,
  latestEntry,
  loadEntries,
  loadProfile,
} from "@/lib/storage";
import { scoreLabelKey } from "@/components/ScoreRing";
import type { Entry } from "@/lib/types";
import { bt } from "@/lib/botox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rose AI — your everyday skin companion for rosacea" },
      {
        name: "description",
        content:
          "Check your skin with a photo, understand today's redness and follow your progress over time.",
      },
      { property: "og:title", content: "Rose AI — your everyday skin companion for rosacea" },
      {
        property: "og:description",
        content: "A calm, private way to track facial redness day by day.",
      },
    ],
  }),
  component: HomePage,
});

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "greeting.morning" as const;
  if (hour < 18) return "greeting.afternoon" as const;
  return "greeting.evening" as const;
}

function HomePage() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState("");

  const navigate = useNavigate();
  useEffect(() => {
    if (!window.localStorage.getItem("rosea.onboarding.v1")) navigate({ to: "/onboarding" });
  }, [navigate]);

  useEffect(() => {
    const sync = () => {
      setEntries(loadEntries());
      setName(loadProfile().name);
    };
    sync();
    window.addEventListener("rosea:entries", sync);
    window.addEventListener("rosea:profile", sync);
    return () => {
      window.removeEventListener("rosea:entries", sync);
      window.removeEventListener("rosea:profile", sync);
    };
  }, []);

  const last = latestEntry(entries);
  const week = useMemo(() => entriesWithinDays(entries, 7), [entries]);
  const prevWeek = useMemo(() => {
    const all = entriesWithinDays(entries, 14);
    return all.filter((e) => !week.includes(e));
  }, [entries, week]);
  const trend = week.length && prevWeek.length ? averageScore(week) - averageScore(prevWeek) : 0;
  const streak = currentStreak(entries);
  const recentTriggers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of week) for (const tr of e.triggers) counts.set(tr, (counts.get(tr) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [week]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const scannedToday = last?.date.slice(0, 10) === todayKey;

  return (
    <div className="animate-rise space-y-7">
      <header>
        <p className="font-display text-3xl leading-none text-primary">{t("app.name")}</p>
        <h1 className="mt-3 text-[2.25rem] leading-[1.15] text-foreground">
          {t(greetingKey())}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("home.question")}</p>
      </header>

      <Link
        to="/onboarding"
        className="surface-lift relative block overflow-hidden active:scale-[0.99] transition-transform"
      >
        <img
          src={heroImg}
          alt=""
          width={1024}
          height={1280}
          className="h-52 w-full object-cover object-[50%_35%]"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-card via-card/85 to-transparent p-5 pt-12">
          <div>
            <p className="eyebrow">{t("app.tagline")}</p>
            <p className="mt-1 font-display text-2xl text-foreground">{t("home.cta")}</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-rose text-primary-foreground">
            <ArrowRight className="h-5 w-5" strokeWidth={1.7} />
          </span>
        </div>
      </Link>

      <BotoxCard />

      <section className="surface grid grid-cols-3 divide-x divide-border/70 p-5">
        <div className="pr-3">
          <p className="eyebrow">{t("home.today")}</p>
          {scannedToday && last ? (
            <>
              <p className="mt-1 font-display text-3xl leading-none text-foreground">
                {last.analysis.score}
              </p>
              <p className="mt-1 text-[0.7rem] leading-tight text-muted-foreground">
                {t(scoreLabelKey(last.analysis.score))}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[0.7rem] leading-tight text-muted-foreground">
              {t("home.noScan")}
            </p>
          )}
        </div>
        <div className="px-3">
          <p className="eyebrow">{t("home.trend")}</p>
          <p className="mt-1 flex items-center gap-1 font-display text-3xl leading-none text-foreground">
            {trend <= 0 ? (
              <TrendingDown className="h-5 w-5 text-[var(--color-sage)]" strokeWidth={1.7} />
            ) : (
              <TrendingUp className="h-5 w-5 text-primary" strokeWidth={1.7} />
            )}
            {trend > 0 ? "+" : ""}
            {trend}
          </p>
          <p className="mt-1 text-[0.7rem] leading-tight text-muted-foreground">7d</p>
        </div>
        <div className="pl-3">
          <p className="eyebrow">{t("home.streak")}</p>
          <p className="mt-1 flex items-center gap-1 font-display text-3xl leading-none text-foreground">
            <Flame className="h-5 w-5 text-primary" strokeWidth={1.7} />
            {streak}
          </p>
          <p className="mt-1 text-[0.7rem] leading-tight text-muted-foreground">{t("home.days")}</p>
        </div>
      </section>

      <section>
        <h2 className="text-lg text-foreground">{t("home.recentTriggers")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("home.recentTriggersNote")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {recentTriggers.length ? (
            recentTriggers.map(([key, count]) => (
              <Chip
                key={key}
                as="span"
                selected
                label={`${t(`trigger.${key}` as never)} · ${count}`}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t("home.noTriggers")}</p>
          )}
        </div>
      </section>

      <section className="surface gradient-dawn flex gap-3 p-5">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.6} />
        <div>
          <p className="text-sm font-medium text-foreground">{t("home.tipTitle")}</p>
          <p className="mt-1 text-sm leading-relaxed text-secondary-foreground">{t("home.tip")}</p>
        </div>
      </section>
    </div>
  );
}

function BotoxCard() {
  const { lang } = useI18n();
  const t = bt(lang);
  return (
    <Link to="/botox" className="surface gradient-dawn block p-5 active:scale-[0.99] transition-transform">
      <p className="eyebrow">{t("tagline")}</p>
      <p className="mt-1 font-display text-2xl text-foreground">{t("title")}</p>
      <p className="mt-1 text-sm leading-relaxed text-secondary-foreground">{t("homeBody")}</p>
      <span className="mt-4 inline-flex items-center gap-2 rounded-full gradient-rose px-4 py-2 text-sm text-primary-foreground">
        {t("homeCta")} <ArrowRight className="h-4 w-4" strokeWidth={1.7} />
      </span>
    </Link>
  );
}
