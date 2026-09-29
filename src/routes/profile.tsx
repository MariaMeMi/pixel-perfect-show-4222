import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { HeartPulse, ImageOff, Languages, LogOut, RotateCcw, ShieldCheck, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { Chip } from "@/components/Chip";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { deleteAccount } from "@/lib/account.functions";
import { clearHistory, deleteAllPhotos, defaultProfile, loadProfile, saveProfile } from "@/lib/storage";
import type { Profile, TriggerKey } from "@/lib/types";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & privacy — Rose AI" },
      {
        name: "description",
        content: "Your skin profile, known triggers, routine, language and photo privacy controls.",
      },
      { property: "og:title", content: "Profile & privacy — Rose AI" },
      {
        property: "og:description",
        content: "Manage your skin profile and decide exactly what stays on your device.",
      },
    ],
  }),
  component: ProfilePage,
});

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
];

const SKIN_TYPES = ["dry", "combination", "oily", "sensitive"];
const SENSITIVITY = ["low", "medium", "high"];
const COUNTRIES = ["US", "GB", "DE", "AT", "CH", "FR", "NL", "SE"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50";

function ProfilePage() {
  const { t, setLang } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteAccountFn = useServerFn(deleteAccount);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);

  async function onStartOver() {
    if (!window.confirm(t("profile.confirmStartOver"))) return;
    setBusy(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      // Preserve any signed-in session; erase everything else on this device.
      const keep: Array<[string, string]> = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("sb-") || k.includes("auth-token"))) keep.push([k, localStorage.getItem(k) ?? ""]);
      }
      localStorage.clear();
      keep.forEach(([k, v]) => localStorage.setItem(k, v));
      sessionStorage.clear();
      navigate({ to: "/onboarding", replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteAccount() {
    if (!window.confirm(t("profile.confirmAccount"))) return;
    setBusy(true);
    try {
      await deleteAccountFn({});
      await supabase.auth.signOut();
      localStorage.clear();
      toast.success(t("profile.accountDeleted"));
      navigate({ to: "/welcome", replace: true });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function update(patch: Partial<Profile>) {
    const next = { ...profile, ...patch };
    setProfile(next);
    saveProfile(next);
    if (patch.language) setLang(patch.language);
  }

  return (
    <div className="animate-rise space-y-8">
      <header>
        <p className="eyebrow">{t("nav.profile")}</p>
        <h1 className="mt-2 text-[2rem] leading-tight text-foreground">{t("profile.title")}</h1>
      </header>

      <section className="surface space-y-4 p-5">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-primary" strokeWidth={1.7} />
          <h2 className="text-lg text-foreground">{t("profile.skin")}</h2>
        </div>
        <Field label={t("profile.name")}>
          <input
            className={inputClass}
            value={profile.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="—"
          />
        </Field>
        <Field label={t("profile.skinType")}>
          <select
            className={inputClass}
            value={profile.skinType}
            onChange={(e) => update({ skinType: e.target.value })}
          >
            {SKIN_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("profile.sensitivity")}>
          <select
            className={inputClass}
            value={profile.sensitivity}
            onChange={(e) => update({ sensitivity: e.target.value })}
          >
            {SENSITIVITY.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section>
        <h2 className="text-lg text-foreground">{t("profile.knownTriggers")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRIGGERS.map((tr) => (
            <Chip
              key={tr}
              label={t(`trigger.${tr}` as const)}
              selected={profile.knownTriggers.includes(tr)}
              onClick={() =>
                update({
                  knownTriggers: profile.knownTriggers.includes(tr)
                    ? profile.knownTriggers.filter((x) => x !== tr)
                    : [...profile.knownTriggers, tr],
                })
              }
            />
          ))}
        </div>
      </section>

      <section className="surface space-y-4 p-5">
        <Field label={t("profile.routine")}>
          <textarea
            className={`${inputClass} min-h-24 resize-none`}
            value={profile.routine}
            onChange={(e) => update({ routine: e.target.value })}
          />
        </Field>
        <Field label={t("profile.products")}>
          <textarea
            className={`${inputClass} min-h-20 resize-none`}
            value={profile.products}
            onChange={(e) => update({ products: e.target.value })}
          />
        </Field>
        <Field label={t("profile.medications")}>
          <textarea
            className={`${inputClass} min-h-20 resize-none`}
            value={profile.medications}
            onChange={(e) => update({ medications: e.target.value })}
            placeholder="—"
          />
        </Field>
      </section>

      <section className="surface space-y-4 p-5">
        <h2 className="text-lg text-foreground">{t("profile.notifications")}</h2>
        <label className="flex items-center justify-between gap-4 text-sm text-secondary-foreground">
          {t("profile.reminders")}
          <input
            type="checkbox"
            checked={profile.remindersEnabled}
            onChange={(e) => update({ remindersEnabled: e.target.checked })}
            className="h-5 w-5 accent-[oklch(0.63_0.13_16)]"
          />
        </label>
      </section>

      <section className="surface space-y-4 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.7} />
          <h2 className="text-lg text-foreground">{t("profile.photoPrivacy")}</h2>
        </div>
        <label className="flex items-center justify-between gap-4 text-sm text-secondary-foreground">
          {t("profile.retainPhotos")}
          <input
            type="checkbox"
            checked={profile.retainPhotos}
            onChange={(e) => update({ retainPhotos: e.target.checked })}
            className="h-5 w-5 accent-[oklch(0.63_0.13_16)]"
          />
        </label>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("profile.retainNote")}</p>
        <button
          onClick={() => {
            if (window.confirm(t("profile.confirmPhotos"))) {
              deleteAllPhotos();
              toast.success(t("profile.saved"));
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-sm text-secondary-foreground"
        >
          <ImageOff className="h-4 w-4" strokeWidth={1.7} />
          {t("profile.deletePhotos")}
        </button>
      </section>

      <section className="surface space-y-4 p-5">
        <h2 className="text-lg text-foreground">{t("profile.dataPrivacy")}</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("profile.dataNote")}</p>
        <button
          onClick={() => {
            if (window.confirm(t("profile.confirmHistory"))) {
              clearHistory();
              toast.success(t("profile.saved"));
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-destructive/30 bg-background py-3 text-sm text-destructive"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.7} />
          {t("profile.deleteHistory")}
        </button>
      </section>

      <section className="surface space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-primary" strokeWidth={1.7} />
          <h2 className="text-lg text-foreground">{t("profile.language")}</h2>
        </div>
        <div className="flex gap-2">
          {(["en", "de"] as const).map((l) => (
            <Chip
              key={l}
              label={l === "en" ? "English" : "Deutsch"}
              selected={profile.language === l}
              onClick={() => update({ language: l })}
            />
          ))}
        </div>
        <Field label={t("profile.country")}>
          <select
            className={inputClass}
            value={profile.country}
            onChange={(e) => update({ country: e.target.value })}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="surface space-y-3 p-5">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-primary" strokeWidth={1.7} />
          <h2 className="text-lg text-foreground">{t("profile.startOver")}</h2>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("profile.startOverDesc")}</p>
        <button
          onClick={onStartOver}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-sm text-secondary-foreground disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={1.7} />
          {t("profile.startOver")}
        </button>
      </section>

      {email && (
        <section className="surface space-y-4 p-5">
          <h2 className="text-lg text-foreground">{t("profile.account")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("profile.signedInAs")} <span className="text-foreground">{email}</span>
          </p>
          <button
            onClick={async () => {
              await queryClient.cancelQueries();
              queryClient.clear();
              await supabase.auth.signOut();
              navigate({ to: "/welcome", replace: true });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-sm text-secondary-foreground"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.7} />
            {t("profile.signOut")}
          </button>
          <button
            onClick={onDeleteAccount}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-destructive/30 bg-background py-3 text-sm text-destructive disabled:opacity-50"
          >
            <UserX className="h-4 w-4" strokeWidth={1.7} />
            {t("profile.deleteAccount")}
          </button>
        </section>
      )}

      <p className="pb-2 text-xs leading-relaxed text-muted-foreground">
        {t("profile.medicalNote")}
      </p>
    </div>
  );
}
