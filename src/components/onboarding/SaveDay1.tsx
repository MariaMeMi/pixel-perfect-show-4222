import { useState } from "react";
import { z } from "zod";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const RESUME_KEY = "rose.onboarding.resume";

/** "Save your Day 1" sign-up screen shown right after the baseline photo. */
export function SaveDay1({ onDone, beforeRedirect }: { onDone: (email?: string) => void; beforeRedirect: () => void }) {
  const [mode, setMode] = useState<"choose" | "email" | "sent">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState("");

  // Already signed in (e.g. from the first-page welcome screen)? Skip straight ahead.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled && data.session) onDone(data.session.user.email ?? undefined);
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function social(provider: "google" | "apple") {
    setBusy(provider); setError("");
    beforeRedirect();
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/onboarding` });
    if (r.error) { setBusy(undefined); sessionStorage.removeItem(RESUME_KEY); toast.error("Sign-in didn't complete. Please try again."); return; }
    if (r.redirected) return;
    sessionStorage.removeItem(RESUME_KEY);
    const { data } = await supabase.auth.getUser();
    onDone(data.user?.email ?? undefined);
  }

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    const p = z.object({ email: z.string().trim().email().max(255), password: z.string().min(8).max(72) }).safeParse({ email, password });
    if (!p.success) return setError("Enter a valid email and a password of at least 8 characters.");
    setBusy("email"); setError("");
    const { data, error } = await supabase.auth.signUp({ email: p.data.email, password: p.data.password, options: { emailRedirectTo: window.location.origin } });
    setBusy(undefined);
    if (error) return setError(error.message);
    if (data.session) onDone(p.data.email);
    else setMode("sent");
  }

  const btn = "flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-sm font-medium text-foreground disabled:opacity-60";

  return (
    <div className="animate-rise flex min-h-[70vh] flex-col justify-center">
      <div className="surface-lift gradient-dawn space-y-5 p-7">
        <h1 className="font-display text-[2rem] leading-tight text-foreground">Save your Day 1 🌹</h1>
        <p className="text-sm leading-relaxed text-secondary-foreground">Create your free Rose AI account to save your baseline and compare your skin over time.</p>

        {mode === "choose" && <div className="space-y-2.5">
          <button type="button" disabled={!!busy} onClick={() => social("google")} className={btn}>{busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="font-semibold">G</span>} Continue with Google</button>
          <button type="button" disabled={!!busy} onClick={() => social("apple")} className={btn}>{busy === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <span></span>} Continue with Apple</button>
          <button type="button" disabled={!!busy} onClick={() => setMode("email")} className={btn}><Mail className="h-4 w-4" /> Continue with email</button>
        </div>}

        {mode === "email" && <form onSubmit={withEmail} className="space-y-3">
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base text-foreground outline-none focus:border-primary" />
          <input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base text-foreground outline-none focus:border-primary" />
          <button type="submit" disabled={!!busy} className="flex w-full items-center justify-center gap-2 rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {busy === "email" && <Loader2 className="h-4 w-4 animate-spin" />} Create my account</button>
          <button type="button" onClick={() => setMode("choose")} className="w-full text-xs text-muted-foreground">← Other options</button>
        </form>}

        {mode === "sent" && <div className="space-y-3">
          <p className="text-sm text-foreground">Check your inbox to confirm <b>{email}</b>. Your Day 1 is saved on this phone in the meantime.</p>
          <button type="button" onClick={() => onDone(email)} className="w-full rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground">Continue</button>
        </div>}

        {error && <p className="text-xs text-destructive">{error}</p>}
        {mode !== "sent" && <button type="button" onClick={() => onDone()} className="w-full text-xs text-muted-foreground underline underline-offset-2">Maybe later</button>}
      </div>
    </div>
  );
}
