import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { articles } from "@/lib/learn-content";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn — Rose AI" },
      {
        name: "description",
        content:
          "Short, calm guides on rosacea triggers, gentle skincare, sun protection and when to see a dermatologist.",
      },
      { property: "og:title", content: "Learn — Rose AI" },
      {
        property: "og:description",
        content: "Simple, reassuring reads about redness-prone skin.",
      },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const { t, lang } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = articles.find((a) => a.id === openId);

  if (open) {
    return (
      <article className="animate-rise space-y-5">
        <button
          onClick={() => setOpenId(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.7} />
          {t("common.back")}
        </button>
        <img
          src={open.image}
          alt=""
          className="h-52 w-full rounded-3xl object-cover"
          loading="lazy"
        />
        <header>
          <p className="eyebrow">
            {open.minutes} {t("learn.readTime")}
          </p>
          <h1 className="mt-2 text-[1.9rem] leading-tight text-foreground">{open.title[lang]}</h1>
        </header>
        <div className="space-y-4">
          {open.body[lang].map((p) => (
            <p key={p} className="text-sm leading-relaxed text-secondary-foreground">
              {p}
            </p>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("results.disclaimer")}</p>
      </article>
    );
  }

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="eyebrow">{t("nav.learn")}</p>
        <h1 className="mt-2 text-[2rem] leading-tight text-foreground">{t("learn.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("learn.subtitle")}</p>
      </header>

      <div className="space-y-4">
        {articles.map((a) => (
          <button
            key={a.id}
            onClick={() => setOpenId(a.id)}
            className="surface flex w-full items-center gap-4 overflow-hidden p-3 text-left active:scale-[0.99]"
          >
            <img
              src={a.image}
              alt=""
              className="h-20 w-20 shrink-0 rounded-2xl object-cover"
              loading="lazy"
            />
            <span className="min-w-0">
              <span className="block font-display text-lg leading-tight text-foreground">
                {a.title[lang]}
              </span>
              <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                {a.teaser[lang]}
              </span>
              <span className="eyebrow mt-2 block">
                {a.minutes} {t("learn.readTime")}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
