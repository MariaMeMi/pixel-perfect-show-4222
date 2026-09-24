import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Lock, Sun, Sparkles, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import type { Analysis } from "@/lib/types";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Check my skin — Rosea" },
      {
        name: "description",
        content: "Take or upload a photo and see a gentle reading of today's visible redness.",
      },
      { property: "og:title", content: "Check my skin — Rosea" },
      {
        property: "og:description",
        content: "A guided selfie check that scores visible facial redness.",
      },
    ],
  }),
  component: AnalyzePage,
});

async function downscale(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });
  const max = 1024;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function AnalyzePage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const uploadRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState<"off" | "starting" | "on">("off");

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCamera("off");
  }

  useEffect(() => stopCamera, []);

  async function startCamera() {
    if (camera !== "off") return;
    setCamera("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCamera("on");
    } catch {
      setCamera("off");
      toast.error(t("analyze.cameraError"));
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const max = 1024;
    const side = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - side) / 2;
    const sy = (video.videoHeight - side) / 2;
    const scale = Math.min(1, max / side);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(side * scale);
    canvas.height = Math.round(side * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror so the photo matches what the user saw in the viewfinder.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, side, side, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL("image/jpeg", 0.86));
    stopCamera();
  }

  async function handleFile(file?: File | null) {
    if (!file) return;
    try {
      setPhoto(await downscale(file));
    } catch {
      toast.error(t("analyze.error"));
    }
  }

  async function analyze() {
    if (!photo) return;
    setBusy(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo, lang }),
      });
      const data = (await res.json()) as Partial<Analysis> & { error?: string };
      if (!res.ok || data.error || typeof data.score !== "number") {
        toast.error(data.error ?? t("analyze.error"));
        setBusy(false);
        return;
      }
      window.sessionStorage.setItem(
        "rosea.pending",
        JSON.stringify({ analysis: data, photo, date: new Date().toISOString() }),
      );
      navigate({ to: "/results" });
    } catch {
      toast.error(t("analyze.error"));
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="relative flex h-56 w-44 items-center justify-center">
          <span className="absolute inset-0 rounded-[50%] gradient-rose opacity-30 animate-rosea-pulse" />
          <span className="absolute inset-4 rounded-[50%] gradient-dawn" />
          {photo ? (
            <img
              src={photo}
              alt=""
              className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] rounded-[50%] object-cover opacity-70"
            />
          ) : null}
        </div>
        <p className="mt-8 font-display text-2xl text-foreground">{t("analyze.analyzing")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("analyze.analyzingNote")}</p>
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="eyebrow">{t("nav.analyze")}</p>
        <h1 className="mt-2 text-[2rem] leading-tight text-foreground">{t("analyze.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("analyze.subtitle")}</p>
      </header>

      <div className="surface-lift relative flex h-[22rem] items-center justify-center overflow-hidden gradient-dawn">
        <div className="relative h-[19rem] w-[14rem]">
          <div className="absolute inset-0 overflow-hidden rounded-[50%] border-2 border-dashed border-primary/40 bg-card/40">
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : camera !== "off" ? (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="h-full w-full -scale-x-100 object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserRound className="h-20 w-20 text-primary/30" strokeWidth={1} />
              </div>
            )}
          </div>
        </div>
      </div>

      <ul className="space-y-2.5 text-sm text-secondary-foreground">
        {[
          { icon: Sun, text: t("analyze.tip1") },
          { icon: Sparkles, text: t("analyze.tip2") },
          { icon: UserRound, text: t("analyze.tip3") },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent">
              <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.7} />
            </span>
            {text}
          </li>
        ))}
      </ul>

      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="space-y-3">
        {photo ? (
          <>
            <button
              onClick={analyze}
              className="w-full rounded-full gradient-rose py-4 text-sm font-medium tracking-wide text-primary-foreground shadow-[var(--shadow-lift)] active:scale-[0.99]"
            >
              {t("analyze.analyze")}
            </button>
            <button
              onClick={() => setPhoto(null)}
              className="w-full rounded-full border border-border bg-card py-4 text-sm text-secondary-foreground active:scale-[0.99]"
            >
              {t("analyze.retake")}
            </button>
          </>
        ) : camera !== "off" ? (
          <>
            <button
              onClick={capture}
              disabled={camera === "starting"}
              className="flex w-full items-center justify-center gap-2 rounded-full gradient-rose py-4 text-sm font-medium tracking-wide text-primary-foreground shadow-[var(--shadow-lift)] active:scale-[0.99] disabled:opacity-60"
            >
              <Camera className="h-4 w-4" strokeWidth={1.7} />
              {camera === "starting" ? t("analyze.startingCamera") : t("analyze.shutter")}
            </button>
            <button
              onClick={stopCamera}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-4 text-sm text-secondary-foreground active:scale-[0.99]"
            >
              <X className="h-4 w-4" strokeWidth={1.7} />
              {t("analyze.closeCamera")}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={startCamera}
              className="flex w-full items-center justify-center gap-2 rounded-full gradient-rose py-4 text-sm font-medium tracking-wide text-primary-foreground shadow-[var(--shadow-lift)] active:scale-[0.99]"
            >
              <Camera className="h-4 w-4" strokeWidth={1.7} />
              {t("analyze.takePhoto")}
            </button>
            <button
              onClick={() => uploadRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-4 text-sm text-secondary-foreground active:scale-[0.99]"
            >
              <ImageUp className="h-4 w-4" strokeWidth={1.7} />
              {t("analyze.uploadPhoto")}
            </button>
          </>
        )}
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
        {t("analyze.privacy")}
      </p>
    </div>
  );
}
