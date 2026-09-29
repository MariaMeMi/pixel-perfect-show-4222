import { useEffect, useRef, useState } from "react";
import { Camera, Check, Lock, Upload } from "lucide-react";

const TIPS = ["Even, consistent lighting", "Face forward", "Similar distance from camera", "No filters", "Minimal or no makeup, if you're comfortable"];

function shrink(src: string) {
  return new Promise<string>((res) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1024 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * k; c.height = img.height * k;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => res(src);
    img.src = src;
  });
}

/** Baseline step: explains why + privacy first, then camera or upload. */
export function BaselineCapture({ photo, retainPhotos, onStart, onPhoto }: { photo?: string; retainPhotos: boolean; onStart: () => void; onPhoto: (url: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const v = videoRef.current; if (!v || !stream) return;
    v.muted = true; v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", "");
    v.srcObject = stream; void v.play().catch(() => {});
  }, [stream]);
  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  const stop = () => { stream?.getTracks().forEach((t) => t.stop()); setStream(null); };
  const start = async () => {
    onStart();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("no camera");
      setStream(await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }));
    } catch { fileRef.current?.click(); }
  };
  const snap = () => {
    const v = videoRef.current; if (!v || !v.videoWidth) return;
    const k = Math.min(1, 1024 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement("canvas"); c.width = v.videoWidth * k; c.height = v.videoHeight * k;
    const ctx = c.getContext("2d")!; ctx.translate(c.width, 0); ctx.scale(-1, 1); ctx.drawImage(v, 0, 0, c.width, c.height);
    onPhoto(c.toDataURL("image/jpeg", 0.85)); stop();
  };
  const onFile = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = async () => onPhoto(await shrink(String(r.result)));
    r.readAsDataURL(f);
  };

  return (
    <div className="space-y-5">
      <div className="relative mx-auto h-64 w-48 overflow-hidden rounded-[50%] border-2 border-dashed border-primary/40 gradient-dawn">
        {stream ? <video ref={videoRef} className="h-full w-full -scale-x-100 object-cover" autoPlay muted playsInline />
          : photo ? <img src={photo} alt="Your baseline photo" className="h-full w-full object-cover" />
          : <div className="flex h-full items-center justify-center text-primary/60"><Camera className="h-10 w-10" /></div>}
      </div>

      {!photo && !stream && (
        <ul className="space-y-1.5">{TIPS.map((t) => <li key={t} className="flex items-center gap-2 text-sm text-foreground"><Check className="h-4 w-4 text-primary" />{t}</li>)}</ul>
      )}

      <div className="surface flex gap-3 p-4 text-xs leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Your photo is used to describe visible redness and to become Day 1 of your personal skin timeline. It is sent once for a reading and not stored on our servers.
          {retainPhotos ? " It stays saved only on this phone" : " Photo saving is off in Profile, so only the reading is kept"}, and you can delete it anytime in Profile → Photo privacy.
        </p>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      {stream ? (
        <div className="flex gap-2">
          <button type="button" onClick={stop} className="flex-1 rounded-full border border-border bg-card py-3.5 text-sm font-medium text-foreground">Cancel</button>
          <button type="button" onClick={snap} className="flex-1 rounded-full gradient-rose py-3.5 text-sm font-medium text-primary-foreground">Capture</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button type="button" onClick={start} className="flex items-center justify-center gap-2 rounded-full gradient-rose py-3.5 text-sm font-medium text-primary-foreground"><Camera className="h-4 w-4" />{photo ? "Retake photo" : "Take my baseline photo"}</button>
          <button type="button" onClick={() => { onStart(); fileRef.current?.click(); }} className="flex items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-sm font-medium text-foreground"><Upload className="h-4 w-4" />Upload a photo</button>
        </div>
      )}
    </div>
  );
}
