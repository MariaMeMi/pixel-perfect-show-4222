import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, Copy, ImageUp, Plus, ShieldCheck, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Chip } from "@/components/Chip";
import { useI18n } from "@/lib/i18n";
import {
  AREAS,
  GOALS,
  MILESTONES,
  aboutArea,
  areaQuestions,
  bt,
  buildQuestions,
  checkQuality,
  loadBotox,
  sampleAnalysis,
  saveBotox,
  type BotoxState,
  type LineAnalysis,
  type LineArea,
  type LineLevel,
  type Milestone,
} from "@/lib/botox";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/botox")({
  head: () => ({
    meta: [
      { title: "Botox AI — explore visible facial lines | Rose AI" },
      {
        name: "description",
        content: "Educational observations about visible facial lines and questions to bring to a qualified provider.",
      },
      { property: "og:title", content: "Botox AI — Rose AI" },
      { property: "og:description", content: "Explore your face and prepare for a professional consultation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BotoxPage,
});

type View = "hub" | "capture" | "analyzing" | "result";

async function fileToDataUrl(file: File): Promise<string> {
  const url = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = new Image();
  await new Promise((r, j) => {
    img.onload = r;
    img.onerror = j;
    img.src = url;
  });
  const scale = Math.min(1, 900 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}

function BotoxPage() {
  const { lang } = useI18n();
  const t = useMemo(() => bt(lang), [lang]);
  const [state, setState] = useState<BotoxState>({ analyses: [], goals: [], tracking: {} });
  const [view, setView] = useState<View>("hub");
  const [accepted, setAccepted] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [current, setCurrent] = useState<LineAnalysis | null>(null);

  useEffect(() => {
    const sync = () => setState(loadBotox());
    sync();
    setAccepted(sessionStorage.getItem("rosea.botox.ack") === "1");
    window.addEventListener("rosea:botox", sync);
    return () => window.removeEventListener("rosea:botox", sync);
  }, []);

  function update(next: BotoxState) {
    setState(next);
    saveBotox(next);
  }

  async function runAnalysis(all: string[]) {
    setView("analyzing");
    try {
      const res = await fetch("/api/botox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: all, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setCurrent({ ...data, id: crypto.randomUUID(), date: new Date().toISOString() });
      setPhotos([]);
      setView("result");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
      setView("capture");
    }
  }

  if (!accepted) {
    return (
      <div className="animate-rise space-y-6">
        <BackHome label={t("back")} />
        <Header t={t} />
        <section className="surface gradient-dawn space-y-4 p-6">
          <ShieldCheck className="h-7 w-7 text-primary" strokeWidth={1.5} />
          <h2 className="text-xl text-foreground">{t("safetyTitle")}</h2>
          <p className="text-sm leading-relaxed text-secondary-foreground">{t("safety")}</p>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem("rosea.botox.ack", "1");
              setAccepted(true);
            }}
            className="w-full rounded-full gradient-rose py-3.5 text-sm font-medium text-primary-foreground"
          >
            {t("understand")}
          </button>
        </section>
      </div>
    );
  }

  if (view === "capture") {
    return (
      <Capture
        t={t}
        step={photos.length}
        onBack={() => {
          setPhotos([]);
          setView("hub");
        }}
        onPhoto={(p) => {
          const all = [...photos, p];
          if (all.length === 4) void runAnalysis(all);
          else setPhotos(all);
        }}
      />
    );
  }

  if (view === "analyzing") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 text-center">
        <div className="relative h-56 w-44">
          <div className="absolute inset-0 rounded-[50%] border border-primary/30 animate-rosea-pulse" />
          <FaceLines active={null} analysis={null} onTap={() => undefined} />
        </div>
        <p className="font-display text-2xl text-foreground">{t("analyzing")}</p>
      </div>
    );
  }

  if (view === "result" && current) {
    return (
      <Result
        t={t}
        analysis={current}
        state={state}
        lang={lang}
        onBack={() => setView("hub")}
        onSave={
          current.sample || state.analyses.some((a) => a.id === current.id)
            ? undefined
            : () => {
                update({ ...state, analyses: [current, ...state.analyses] });
                toast.success(t("saved"));
              }
        }
        onGoals={(goals) => update({ ...state, goals })}
      />
    );
  }

  return (
    <div className="animate-rise space-y-7">
      <BackHome label={t("back")} />
      <Header t={t} />
      <section className="surface-lift gradient-dawn space-y-4 p-6">
        <p className="eyebrow">{t("tagline")}</p>
        <ul className="space-y-1.5 text-sm text-secondary-foreground">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-card text-[0.65rem] text-primary">
                {i + 1}
              </span>
              {t(`pose.${i}`)}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setView("capture")}
          className="w-full rounded-full gradient-rose py-3.5 text-sm font-medium text-primary-foreground"
        >
          {t("homeCta")}
        </button>
        <button
          type="button"
          onClick={() => {
            setCurrent(sampleAnalysis(lang));
            setView("result");
          }}
          className="w-full rounded-full border border-border bg-card py-3 text-sm text-foreground"
        >
          {t("sample")}
        </button>
        <p className="text-center text-[0.7rem] text-muted-foreground">{t("privacy")}</p>
      </section>

      {state.analyses.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg text-foreground">{t("history")}</h2>
          {state.analyses.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setCurrent(a);
                setView("result");
              }}
              className="surface flex w-full items-center justify-between p-4 text-left"
            >
              <div>
                <p className="text-sm text-foreground">
                  {new Date(a.date).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.summary}</p>
              </div>
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            </button>
          ))}
        </section>
      )}

      <Tracking t={t} state={state} update={update} />

      <button
        type="button"
        onClick={() => {
          update({ analyses: [], goals: [], tracking: {} });
          toast.success(t("deleted"));
        }}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-destructive/30 py-3 text-sm text-destructive"
      >
        <Trash2 className="h-4 w-4" /> {t("deleteAll")}
      </button>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}

function BackHome({ label }: { label: string }) {
  return (
    <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <ArrowLeft className="h-4 w-4" /> {label}
    </Link>
  );
}

function Header({ t }: { t: (k: string) => string }) {
  return (
    <header>
      <p className="eyebrow">Rose AI</p>
      <h1 className="mt-2 text-[2.25rem] leading-[1.1] text-foreground">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
    </header>
  );
}

function Capture({
  t,
  step,
  onBack,
  onPhoto,
}: {
  t: (k: string) => string;
  step: number;
  onBack: () => void;
  onPhoto: (p: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const [quality, setQuality] = useState<string | null>(null);

  const stop = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setCamera(false);
  };
  useEffect(() => stop, []);

  useEffect(() => {
    const v = videoRef.current;
    const s = streamRef.current;
    if (!camera || !v || !s) return;
    v.muted = true;
    v.setAttribute("playsinline", "true");
    if (v.srcObject !== s) v.srcObject = s;
    void v.play().catch(() => undefined);
  }, [camera]);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      nativeRef.current?.click();
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = s;
      setCamera(true);
    } catch {
      nativeRef.current?.click();
    }
  }

  async function accept(dataUrl: string) {
    setShot(dataUrl);
    setQuality(await checkQuality(dataUrl).catch(() => "ok"));
  }

  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const side = Math.min(v.videoWidth, v.videoHeight);
    const size = Math.min(900, side);
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, size, size);
    stop();
    void accept(c.toDataURL("image/jpeg", 0.85));
  }

  return (
    <div className="animate-rise space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("back")}
      </button>
      <div>
        <p className="eyebrow">
          {t("step")} {step + 1} {t("of")} 4
        </p>
        <h1 className="mt-1 text-3xl text-foreground">{t(`pose.${step}`)}</h1>
        <div className="mt-3 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-border")} />
          ))}
        </div>
      </div>

      <div className="surface relative mx-auto aspect-square w-full overflow-hidden">
        {shot ? (
          <img src={shot} alt="" className="h-full w-full object-cover" />
        ) : camera ? (
          <video ref={videoRef} muted playsInline autoPlay className="h-full w-full -scale-x-100 object-cover" />
        ) : (
          <div className="gradient-veil h-full w-full" />
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[78%] w-[58%] rounded-[50%] border-2 border-dashed border-card/90 shadow-[0_0_0_999px_oklch(0.98_0.01_80/35%)]" />
        </div>
      </div>

      {!shot && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>· {t("guide1")}</li>
          <li>· {t("guide2")}</li>
          <li>· {t("guide3")}</li>
        </ul>
      )}

      {shot && quality && (
        <p
          className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            quality === "ok" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground",
          )}
        >
          {t(`q.${quality}`)}
        </p>
      )}

      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void accept(await fileToDataUrl(f));
        }}
      />

      <input
        ref={nativeRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void accept(await fileToDataUrl(f));
        }}
      />

      {shot ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setShot(null);
              setQuality(null);
            }}
            className="rounded-full border border-border bg-card py-3.5 text-sm text-foreground"
          >
            {t("retake")}
          </button>
          <button
            type="button"
            onClick={() => {
              const p = shot;
              setShot(null);
              setQuality(null);
              onPhoto(p);
            }}
            className="rounded-full gradient-rose py-3.5 text-sm font-medium text-primary-foreground"
          >
            {t("next")}
          </button>
        </div>
      ) : camera ? (
        <div className="flex items-center justify-center gap-6">
          <button type="button" onClick={stop} aria-label={t("closeCamera")} className="rounded-full bg-card p-3 text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={capture}
            aria-label={t("takePhoto")}
            className="h-16 w-16 rounded-full border-4 border-card gradient-rose shadow-lg"
          />
          <span className="w-11" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={start}
            className="flex items-center justify-center gap-2 rounded-full gradient-rose py-3.5 text-sm font-medium text-primary-foreground"
          >
            <Camera className="h-4 w-4" /> {t("takePhoto")}
          </button>
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-sm text-foreground"
          >
            <ImageUp className="h-4 w-4" /> {t("upload")}
          </button>
        </div>
      )}
    </div>
  );
}

const LEVEL_WEIGHT: Record<LineLevel, number> = { not_prominent: 1, visible_with_expression: 2, visible_at_rest: 3 };

function FaceLines({
  analysis,
  active,
  onTap,
}: {
  analysis: LineAnalysis | null;
  active: LineArea | null;
  onTap: (a: LineArea) => void;
}) {
  const op = (a: LineArea) => (analysis ? 0.18 + LEVEL_WEIGHT[analysis[a].level] * 0.14 : 0.15);
  const zone = (a: LineArea) =>
    cn("cursor-pointer transition-all", active === a ? "stroke-[var(--color-primary)]" : "stroke-transparent");
  return (
    <svg viewBox="0 0 200 260" className="h-full w-full">
      <defs>
        <radialGradient id="bx" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c95a52" />
          <stop offset="100%" stopColor="#c95a52" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="130" rx="78" ry="108" fill="#fbf3ee" stroke="#e8cfc4" strokeWidth="1.5" />
      <path d="M62 104 q14 -8 28 0 M110 104 q14 -8 28 0" stroke="#b69487" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M66 122 q10 -6 20 0 M114 122 q10 -6 20 0" stroke="#b69487" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M100 128 v28 q-6 6 0 8" stroke="#d3b5a8" strokeWidth="1.3" fill="none" />
      <path d="M82 190 q18 10 36 0" stroke="#c98f86" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* forehead */}
      <g onClick={() => onTap("forehead")}>
        <ellipse cx="100" cy="62" rx="52" ry="26" fill="url(#bx)" opacity={op("forehead")} />
        <path d="M70 55 q30 -6 60 0 M74 67 q26 -5 52 0" stroke="#c98f86" strokeWidth="1" fill="none" opacity="0.7" />
        <ellipse cx="100" cy="62" rx="56" ry="30" fill="transparent" strokeWidth="1.5" strokeDasharray="4 4" className={zone("forehead")} />
      </g>
      {/* glabella */}
      <g onClick={() => onTap("glabella")}>
        <ellipse cx="100" cy="100" rx="14" ry="14" fill="url(#bx)" opacity={op("glabella")} />
        <path d="M96 92 v14 M104 92 v14" stroke="#c98f86" strokeWidth="1" opacity="0.7" />
        <circle cx="100" cy="100" r="17" fill="transparent" strokeWidth="1.5" strokeDasharray="4 4" className={zone("glabella")} />
      </g>
      {/* eyes */}
      <g onClick={() => onTap("eyes")}>
        {[46, 154].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="122" rx="14" ry="16" fill="url(#bx)" opacity={op("eyes")} />
            <path
              d={x < 100 ? `M${x + 6} 116 l-10 -4 M${x + 6} 122 l-11 0 M${x + 6} 128 l-10 4` : `M${x - 6} 116 l10 -4 M${x - 6} 122 l11 0 M${x - 6} 128 l10 4`}
              stroke="#c98f86"
              strokeWidth="1"
              opacity="0.7"
            />
            <ellipse cx={x} cy="122" rx="17" ry="19" fill="transparent" strokeWidth="1.5" strokeDasharray="4 4" className={zone("eyes")} />
          </g>
        ))}
      </g>
    </svg>
  );
}

function Result({
  t,
  analysis,
  state,
  lang,
  onBack,
  onSave,
  onGoals,
}: {
  t: (k: string) => string;
  analysis: LineAnalysis;
  state: BotoxState;
  lang: "en" | "de";
  onBack: () => void;
  onSave: (() => void) | undefined;
  onGoals: (g: BotoxState["goals"]) => void;
}) {
  const [active, setActive] = useState<LineArea>("forehead");
  const questions = buildQuestions(lang, state.goals, analysis);
  const levelTone: Record<LineLevel, string> = {
    not_prominent: "bg-[var(--color-sage)]/20 text-foreground",
    visible_with_expression: "bg-accent text-accent-foreground",
    visible_at_rest: "bg-primary/15 text-foreground",
  };

  return (
    <div className="animate-rise space-y-7">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("title")}
      </button>
      <header>
        <p className="eyebrow">
          {t("title")} {analysis.sample ? `· ${t("sampleBadge")}` : ""}
        </p>
        <h1 className="mt-2 text-[2.1rem] leading-[1.1] text-foreground">{t("resultTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{analysis.summary}</p>
      </header>

      <section className="surface space-y-3 p-5">
        {AREAS.map((a) => (
          <div key={a} className="flex items-center justify-between gap-3">
            <span className="text-sm text-foreground">{t(`cat.${a}`)}</span>
            <span className={cn("rounded-full px-3 py-1 text-xs", levelTone[analysis[a].level])}>
              {t(`level.${analysis[a].level}`)}
            </span>
          </div>
        ))}
        <div className="border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <span className="text-foreground">{t("symmetry")}: </span>
          {analysis.symmetry}
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-center text-xs text-muted-foreground">{t("tapArea")}</p>
        <div className="mx-auto h-72 w-56">
          <FaceLines analysis={analysis} active={active} onTap={setActive} />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {AREAS.map((a) => (
            <Chip key={a} label={t(`area.${a}`)} selected={active === a} onClick={() => setActive(a)} />
          ))}
        </div>
        <article key={active} className="surface animate-rise space-y-4 p-5">
          <h2 className="font-display text-2xl uppercase tracking-wide text-foreground">{t(`area.${active}`)}</h2>
          <div>
            <p className="eyebrow">{t("noticed")}</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{analysis[active].noticed}</p>
          </div>
          <div>
            <p className="eyebrow">{t("why")}</p>
            <p className="mt-1 text-sm leading-relaxed text-secondary-foreground">{aboutArea(lang, active)}</p>
          </div>
          <div>
            <p className="eyebrow">{t("ask")}</p>
            <ul className="mt-1 space-y-1.5 text-sm text-secondary-foreground">
              {areaQuestions(lang, active).map((q) => (
                <li key={q}>“{q}”</li>
              ))}
            </ul>
          </div>
          <Link to="/learn" className="inline-block text-sm text-primary underline underline-offset-4">
            {t("learnArea")}
          </Link>
        </article>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl text-foreground">{t("prepTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("prepBody")}</p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <Chip
              key={g}
              label={t(`goal.${g}`)}
              selected={state.goals.includes(g)}
              onClick={() =>
                onGoals(state.goals.includes(g) ? state.goals.filter((x) => x !== g) : [...state.goals, g])
              }
            />
          ))}
        </div>
        <div className="surface gradient-dawn space-y-3 p-5">
          <p className="eyebrow">{t("yourQuestions")}</p>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
            {questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(questions.map((q, i) => `${i + 1}. ${q}`).join("\n"));
              toast.success(t("copied"));
            }}
            className="inline-flex items-center gap-2 text-sm text-primary"
          >
            <Copy className="h-4 w-4" /> {t("copy")}
          </button>
        </div>
      </section>

      {onSave && (
        <button
          type="button"
          onClick={onSave}
          className="flex w-full items-center justify-center gap-2 rounded-full gradient-rose py-3.5 text-sm font-medium text-primary-foreground"
        >
          <Check className="h-4 w-4" /> {t("save")}
        </button>
      )}
      <p className="text-center text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}

function Tracking({
  t,
  state,
  update,
}: {
  t: (k: string) => string;
  state: BotoxState;
  update: (s: BotoxState) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<Milestone | null>(null);
  const filled = MILESTONES.filter((m) => state.tracking[m]);
  const [a, setA] = useState<Milestone | null>(null);
  const [b, setB] = useState<Milestone | null>(null);
  const left = a && state.tracking[a] ? a : filled[0];
  const right = b && state.tracking[b] ? b : filled[filled.length - 1];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl text-foreground">{t("trackTitle")}</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("trackBody")}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f || !target) return;
          const photo = await fileToDataUrl(f);
          update({ ...state, tracking: { ...state.tracking, [target]: { photo, date: new Date().toISOString() } } });
        }}
      />
      <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
        {MILESTONES.map((m) => {
          const item = state.tracking[m];
          return (
            <div key={m} className="w-28 shrink-0">
              {item ? (
                <div className="relative">
                  <img src={item.photo} alt={t(`m.${m}`)} className="aspect-[3/4] w-full rounded-2xl object-cover" />
                  <button
                    type="button"
                    aria-label={t("remove")}
                    onClick={() => {
                      const next = { ...state.tracking };
                      delete next[m];
                      update({ ...state, tracking: next });
                    }}
                    className="absolute right-1.5 top-1.5 rounded-full bg-card/90 p-1 text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTarget(m);
                    inputRef.current?.click();
                  }}
                  className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-card text-xs text-muted-foreground"
                >
                  <Plus className="h-4 w-4" /> {t("add")}
                </button>
              )}
              <p className="mt-1.5 text-center text-[0.7rem] text-foreground">{t(`m.${m}`)}</p>
            </div>
          );
        })}
      </div>

      {filled.length >= 2 && left && right && (
        <div className="surface space-y-3 p-4">
          <p className="eyebrow">{t("compare")}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: left, set: setA },
              { v: right, set: setB },
            ].map(({ v, set }, i) => (
              <div key={i} className="space-y-2">
                <img src={state.tracking[v]!.photo} alt="" className="aspect-[3/4] w-full rounded-xl object-cover" />
                <select
                  value={v}
                  onChange={(e) => set(e.target.value as Milestone)}
                  className="w-full rounded-full border border-border bg-card px-3 py-1.5 text-xs"
                >
                  {filled.map((m) => (
                    <option key={m} value={m}>
                      {t(`m.${m}`)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p className="text-[0.7rem] text-muted-foreground">{t("compareNote")}</p>
        </div>
      )}
    </section>
  );
}
