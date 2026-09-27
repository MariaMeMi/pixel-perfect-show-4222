import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, EyeOff, Image as ImageIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { loadEntries } from "@/lib/storage";
import type { Entry } from "@/lib/types";
import { referralUrl, track } from "@/lib/experiment";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "My Skin Journey — Rose AI" },
      { name: "description", content: "Create a private-by-default progress card of your skin timeline to share." },
      { property: "og:title", content: "My Skin Journey — Rose AI" },
      { property: "og:description", content: "Tracking my skin, not guessing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JourneyPage,
});

const C = {
  en: {
    title: "My Skin Journey 🌹",
    how: "How would you like to share your journey?",
    hide: "Hide my photos",
    hideNote: "Shows your redness timeline instead of your face.",
    include: "Include my photos",
    includeNote: "Uses two of your check-in photos.",
    left: "Left photo",
    right: "Right photo",
    caption: "Caption",
    captions: [
      "Tracking my skin, not guessing.",
      "Learning my skin one check-in at a time.",
      "My skin journey 🌹",
      "Understanding my skin over time.",
    ],
    own: "Write my own",
    ownPh: "Your caption (no medical claims)",
    create: "Create my card",
    preview: "Your Skin Journey",
    share: "Share My Journey",
    save: "Save Image",
    edit: "Edit card",
    note: "Your photos are only included if you choose to share them.",
    day1: "Day 1",
    today: "Today",
    days: "days tracked",
    checkins: "check-ins",
    tracked: "Tracked with Rose AI 🌹",
    need: "You need at least 3 check-ins to create your journey.",
    noPhotos: "You need at least 2 saved photos to include photos.",
    shareText: "My skin journey, tracked with Rose AI 🌹",
    back: "Back",
  },
  de: {
    title: "Meine Hautreise 🌹",
    how: "Wie möchtest du deine Reise teilen?",
    hide: "Fotos ausblenden",
    hideNote: "Zeigt deinen Rötungsverlauf statt deines Gesichts.",
    include: "Meine Fotos einbeziehen",
    includeNote: "Nutzt zwei deiner Check-in-Fotos.",
    left: "Linkes Foto",
    right: "Rechtes Foto",
    caption: "Text",
    captions: [
      "Ich verfolge meine Haut, statt zu raten.",
      "Ich lerne meine Haut Check-in für Check-in kennen.",
      "Meine Hautreise 🌹",
      "Meine Haut mit der Zeit verstehen.",
    ],
    own: "Eigenen Text schreiben",
    ownPh: "Dein Text (keine medizinischen Aussagen)",
    create: "Karte erstellen",
    preview: "Deine Hautreise",
    share: "Meine Reise teilen",
    save: "Bild speichern",
    edit: "Karte bearbeiten",
    note: "Deine Fotos werden nur einbezogen, wenn du es möchtest.",
    day1: "Tag 1",
    today: "Heute",
    days: "Tage verfolgt",
    checkins: "Check-ins",
    tracked: "Verfolgt mit Rose AI 🌹",
    need: "Du brauchst mindestens 3 Check-ins für deine Reise.",
    noPhotos: "Du brauchst mindestens 2 gespeicherte Fotos.",
    shareText: "Meine Hautreise, verfolgt mit Rose AI 🌹",
    back: "Zurück",
  },
};

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

async function drawCard(opts: {
  entries: Entry[];
  left?: Entry;
  right?: Entry;
  withPhotos: boolean;
  caption: string;
  c: (typeof C)["en"];
  locale: string;
}): Promise<Blob> {
  const { entries, left, right, withPhotos, caption, c, locale } = opts;
  await document.fonts?.ready;
  const W = 1080, H = 1920;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  // brand palette (canvas output, not themed UI)
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#fbf3ee");
  bg.addColorStop(1, "#f3dcd4");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const ink = "#3b2a2a", rose = "#c26a66", muted = "#8a6f6c";
  const serif = '"Cormorant Garamond", Georgia, serif';
  const sans = 'Karla, system-ui, sans-serif';
  ctx.textAlign = "center";

  ctx.fillStyle = rose;
  ctx.font = `600 44px ${serif}`;
  ctx.fillText("🌹 ROSE AI", W / 2, 170);
  ctx.fillStyle = ink;
  ctx.font = `500 96px ${serif}`;
  ctx.fillText(c.title.replace(" 🌹", "").toUpperCase(), W / 2, 300);

  const fmt = (e?: Entry) =>
    e ? new Date(e.date).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "";

  const top = 400;
  if (withPhotos && left?.photo && right?.photo) {
    const pw = 440, ph = 620, gap = 40, x0 = (W - pw * 2 - gap) / 2;
    const imgs = await Promise.all([loadImg(left.photo), loadImg(right.photo)]);
    imgs.forEach((img, i) => {
      const x = x0 + i * (pw + gap);
      ctx.save();
      roundRect(ctx, x, top + 60, pw, ph, 36);
      ctx.clip();
      const s = Math.max(pw / img.width, ph / img.height);
      ctx.drawImage(img, x + (pw - img.width * s) / 2, top + 60 + (ph - img.height * s) / 2, img.width * s, img.height * s);
      ctx.restore();
      ctx.fillStyle = ink;
      ctx.font = `600 40px ${sans}`;
      ctx.fillText(i === 0 ? c.day1 : c.today, x + pw / 2, top + 30);
      ctx.fillStyle = muted;
      ctx.font = `400 32px ${sans}`;
      ctx.fillText(fmt(i === 0 ? left : right), x + pw / 2, top + ph + 120);
    });
  } else {
    // timeline visualization, no face
    const x = 110, w = W - 220, y = top + 40, h = 620;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    roundRect(ctx, x, y, w, h, 40);
    ctx.fill();
    const pts = entries.map((e, i) => ({
      x: x + 70 + (entries.length === 1 ? 0 : (i / (entries.length - 1)) * (w - 140)),
      y: y + 80 + (1 - e.analysis.score / 100) * (h - 200),
    }));
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, "rgba(194,106,102,0.35)");
    grad.addColorStop(1, "rgba(194,106,102,0)");
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.lineTo(pts[pts.length - 1]!.x, y + h - 120);
    ctx.lineTo(pts[0]!.x, y + h - 120);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.strokeStyle = rose;
    ctx.lineWidth = 8;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.fillStyle = rose;
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = ink;
    ctx.font = `600 36px ${sans}`;
    ctx.textAlign = "left";
    ctx.fillText(c.day1, x + 50, y + h - 60);
    ctx.textAlign = "right";
    ctx.fillText(c.today, x + w - 50, y + h - 60);
    ctx.textAlign = "center";
  }

  const first = entries[0], last = entries[entries.length - 1];
  const days = first && last
    ? Math.max(1, Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000) + 1)
    : 0;
  ctx.fillStyle = ink;
  ctx.font = `500 64px ${serif}`;
  ctx.fillText(`${days} ${c.days}`, W / 2, 1270);
  ctx.fillText(`${entries.length} ${c.checkins}`, W / 2, 1350);

  // caption, wrapped
  ctx.font = `italic 500 64px ${serif}`;
  ctx.fillStyle = rose;
  const words = caption.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const wd of words) {
    const t = line ? `${line} ${wd}` : wd;
    if (ctx.measureText(t).width > W - 200 && line) {
      lines.push(line);
      line = wd;
    } else line = t;
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, 1500 + i * 78));

  ctx.fillStyle = muted;
  ctx.font = `400 32px ${sans}`;
  ctx.fillText(c.tracked, W / 2, 1790);
  ctx.font = `400 28px ${sans}`;
  ctx.fillText(window.location.host, W / 2, 1840);

  return new Promise((res) => cv.toBlob((b) => res(b!), "image/png"));
}

function JourneyPage() {
  const { lang } = useI18n();
  const c = C[lang === "de" ? "de" : "en"];
  const locale = lang === "de" ? "de-DE" : "en-GB";
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [withPhotos, setWithPhotos] = useState(false);
  const [leftId, setLeftId] = useState<string>();
  const [rightId, setRightId] = useState<string>();
  const [capIdx, setCapIdx] = useState(0);
  const [own, setOwn] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const e = loadEntries();
    setEntries(e);
    const ph = e.filter((x) => x.photo);
    setLeftId(ph[0]?.id);
    setRightId(ph[ph.length - 1]?.id);
    track("skin_journey_started", "skin_journey");
  }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const photos = useMemo(() => entries.filter((e) => e.photo), [entries]);
  const caption = capIdx === -1 ? own.trim() || c.captions[0]! : c.captions[capIdx]!;
  const fmt = (e: Entry) => new Date(e.date).toLocaleDateString(locale, { day: "numeric", month: "short" });

  if (entries.length && entries.length < 3) {
    return (
      <div className="animate-rise space-y-4">
        <p className="text-sm text-muted-foreground">{c.need}</p>
        <Link to="/progress" className="text-sm text-primary underline">{c.back}</Link>
      </div>
    );
  }

  async function generate() {
    setBusy(true);
    try {
      const b = await drawCard({
        entries,
        left: photos.find((p) => p.id === leftId),
        right: photos.find((p) => p.id === rightId),
        withPhotos,
        caption,
        c,
        locale,
      });
      setBlob(b);
      setUrl(URL.createObjectURL(b));
      track("skin_journey_generated", "skin_journey");
      track("share_card_created", "skin_journey");
    } catch {
      toast.error("Could not create the card. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-skin-journey.png";
    a.click();
    track("skin_journey_saved", "skin_journey");
  }

  async function share() {
    if (!blob) return;
    track("share_clicked", "skin_journey");
    const link = referralUrl();
    const file = new File([blob], "my-skin-journey.png", { type: "image/png" });
    const data: ShareData = { files: [file], text: `${c.shareText} ${link}` };
    if (navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
        track("skin_journey_shared", "skin_journey");
      } catch {
        /* user cancelled */
      }
    } else {
      download();
      try {
        await navigator.clipboard.writeText(link);
        toast.success(lang === "de" ? "Bild gespeichert, Link kopiert" : "Image saved, link copied");
      } catch {
        /* ignore */
      }
    }
  }

  if (url) {
    return (
      <div className="animate-rise space-y-5">
        <h1 className="text-[1.9rem] leading-tight text-foreground">{c.preview}</h1>
        <img src={url} alt={c.preview} className="mx-auto w-full max-w-xs rounded-3xl border border-border shadow-[var(--shadow-lift)]" />
        <button onClick={share} className="flex w-full items-center justify-center gap-2 rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-lift)]">
          <Share2 className="h-4 w-4" /> {c.share}
        </button>
        <button onClick={download} className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-4 text-sm text-foreground">
          <Download className="h-4 w-4" /> {c.save}
        </button>
        <button onClick={() => { setUrl(undefined); setBlob(null); }} className="w-full text-sm text-primary underline underline-offset-4">
          {c.edit}
        </button>
        <p className="text-center text-xs text-muted-foreground">{c.note}</p>
      </div>
    );
  }

  const Picker = ({ label, value, onPick }: { label: string; value?: string; onPick: (id: string) => void }) => (
    <div>
      <p className="eyebrow">{label}</p>
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
        {photos.map((p) => (
          <button key={p.id} onClick={() => onPick(p.id)} className={`w-20 shrink-0 rounded-2xl border-2 p-0.5 ${value === p.id ? "border-primary" : "border-transparent"}`}>
            <img src={p.photo} alt="" className="h-24 w-full rounded-xl object-cover" />
            <span className="mt-1 block text-[0.65rem] text-muted-foreground">{fmt(p)}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-rise space-y-7">
      <button onClick={() => navigate({ to: "/progress" })} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {c.back}
      </button>
      <h1 className="text-[2rem] leading-tight text-foreground">{c.title}</h1>

      <section className="space-y-3">
        <h2 className="text-lg text-foreground">{c.how}</h2>
        {([
          [false, c.hide, c.hideNote, EyeOff],
          [true, c.include, c.includeNote, ImageIcon],
        ] as const).map(([val, title, note, Icon]) => {
          const disabled = val && photos.length < 2;
          return (
            <button
              key={title}
              disabled={disabled}
              onClick={() => {
                setWithPhotos(val);
                track(val ? "skin_journey_photo_mode_selected" : "skin_journey_private_mode_selected", "skin_journey");
              }}
              className={`surface flex w-full items-start gap-3 p-4 text-left ${withPhotos === val ? "ring-2 ring-primary" : ""} ${disabled ? "opacity-50" : ""}`}
            >
              <Icon className="mt-0.5 h-5 w-5 text-primary" strokeWidth={1.6} />
              <span>
                <span className="block text-sm text-foreground">{title}</span>
                <span className="block text-xs text-muted-foreground">{disabled ? c.noPhotos : note}</span>
              </span>
            </button>
          );
        })}
      </section>

      {withPhotos ? (
        <section className="space-y-4">
          <Picker label={`${c.left} · ${c.day1}`} value={leftId} onPick={setLeftId} />
          <Picker label={`${c.right} · ${c.today}`} value={rightId} onPick={setRightId} />
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-lg text-foreground">{c.caption}</h2>
        {c.captions.map((cap, i) => (
          <button key={cap} onClick={() => setCapIdx(i)} className={`surface block w-full p-3 text-left text-sm ${capIdx === i ? "ring-2 ring-primary" : ""}`}>
            {cap}
          </button>
        ))}
        <button onClick={() => setCapIdx(-1)} className={`surface block w-full p-3 text-left text-sm ${capIdx === -1 ? "ring-2 ring-primary" : ""}`}>
          {c.own}
        </button>
        {capIdx === -1 ? (
          <input value={own} maxLength={70} onChange={(e) => setOwn(e.target.value)} placeholder={c.ownPh} className="w-full rounded-2xl border border-border bg-card p-3 text-sm" />
        ) : null}
      </section>

      <button disabled={busy || !entries.length} onClick={generate} className="w-full rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-60">
        {c.create}
      </button>
      <p className="text-center text-xs text-muted-foreground">{c.note}</p>
    </div>
  );
}
