import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/experiment";
import { ONBOARDING_KEY } from "@/lib/onboarding/flow";
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Flower2, Stethoscope } from 'lucide-react';
import { dashboardDestination } from '@/lib/clinician/navigation';

export const Route = createFileRoute("/welcome")({
  validateSearch: (s: Record<string, unknown>): {clinician?: boolean} => (s['clinician'] === true || s['clinician'] === 'true' ? {clinician:true} : {}),
  head: () => ({
    meta: [
      { title: "Welcome to Rose AI — sign up or sign in" },
      { name: "description", content: "Create your free Rose AI account or sign in to keep your skin baseline and follow your progress over time." },
      { property: "og:title", content: "Welcome to Rose AI — sign up or sign in" },
      { property: "og:description", content: "Your everyday skin companion for rosacea." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WelcomePage,
});

function onboardingCompleted(): boolean {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return false;
    return Boolean((JSON.parse(raw) as { completedAt?: string }).completedAt);
  } catch {
    return false;
  }
}

function WelcomePage() {
  const search = Route.useSearch();
  const [skinSelected, setSkinSelected] = useState(false);
  const navigate = useNavigate();
  const [mode, setMode] = useState<"choose" | "signin" | "signup" | "sent">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  async function continueSignedIn() {
    const {data,error} = await supabase.rpc('is_clinician');
    if(error) { setError('Could not load your account. Please try again.'); setReady(true); return; }
    if(data !== true && !search.clinician) await supabase.rpc('record_consumer_choice');
    void navigate({to:data === true ? dashboardDestination(true, onboardingCompleted()) : destination(),replace:true});
  }

  // Signed-in users continue where they left off; this page is only for signed-out visitors.
  useEffect(() => {
    let cancelled = false;
    setSkinSelected(onboardingCompleted());
    const go = () => { setTimeout(() => {if(!cancelled) void continueSignedIn();},0); };
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!cancelled && session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) go();
    });
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) { go(); return; }
      setReady(true);
    })();
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [navigate, search.clinician]);

  function destination() {
    return search.clinician ? '/clinician/onboarding' : onboardingCompleted() ? "/" : "/onboarding";
  }

  async function social(provider: "google" | "apple") {
    setBusy(provider); setError("");
    track("auth_started", "skin_journey", provider);
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/welcome${search.clinician ? '?clinician=true' : ''}` });
    if (r.error) { console.error("OAuth error", r.error); setBusy(undefined); toast.error("Sign-in didn't complete. Please try again."); return; }
    if (r.redirected) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) { track("auth_completed", "skin_journey", provider); await continueSignedIn(); }
    else {setBusy(undefined);setError('Sign-in did not complete. Please try again.');}
  }

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    const p = z.object({ email: z.string().trim().email().max(255), password: z.string().min(8).max(72) }).safeParse({ email, password });
    if (!p.success) return setError("Enter a valid email and a password of at least 8 characters.");
    setBusy("email"); setError("");
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: p.data.email, password: p.data.password });
      setBusy(undefined);
      if (error) return setError("That email and password don't match an account. Check your details or create a new account.");
      track("auth_completed", "skin_journey", "email_signin");
      await continueSignedIn();
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email: p.data.email, password: p.data.password, options: { emailRedirectTo: `${window.location.origin}/welcome${search.clinician ? '?clinician=true' : ''}` } });
    setBusy(undefined);
    if (error) return setError(error.message);
    track("auth_completed", "skin_journey", "email_signup");
    if (data.session) await continueSignedIn();
    else setMode("sent");
  }

  const btn = "flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-sm font-medium text-foreground disabled:opacity-60";

  if (!ready) return <div className="min-h-[70vh]" aria-hidden="true" />;

  return (
    <div className="animate-rise flex min-h-[80vh] flex-col justify-center">
      <div className="surface-lift gradient-dawn space-y-6 p-7">
        <div className="text-center">
          <p className="eyebrow">Rose AI</p>
          <h1 className="mt-2 font-display text-[2rem] leading-tight text-foreground">Welcome to Rose AI 🌹</h1>
          <p className="mt-3 text-sm leading-relaxed text-secondary-foreground">
            Your everyday skin companion for rosacea. Create a free account to save your baseline and compare your skin over time — or sign in if you already have one.
          </p>
        </div>

        {mode === 'choose' && !skinSelected && !search.clinician ? <div className="space-y-3">
          <button type="button" disabled={!!busy} onClick={() => { track("onboarding_started", "onboarding", "guest"); void navigate({ to: "/onboarding", replace: true }); }} className="flex w-full items-center justify-center gap-2 rounded-full gradient-rose py-4 text-base font-medium text-primary-foreground shadow-sm disabled:opacity-60">Continue without signing up</button>
          <h2 className="pt-2 text-center text-xl">How would you like to use Rose AI?</h2>
          <Button variant="outline" className="h-auto w-full justify-start gap-3 whitespace-normal rounded-md p-4 text-left" onClick={() => setSkinSelected(true)}><Flower2/><span><span className="block font-semibold">For my skin</span><span className="block text-xs font-normal text-muted-foreground">Track your skin changes and progress.</span></span></Button>
          <Button asChild variant="outline" className="h-auto w-full justify-start gap-3 whitespace-normal rounded-md p-4 text-left"><Link to="/clinician/onboarding"><Stethoscope/><span><span className="block font-semibold">I'm a clinician</span><span className="block text-xs font-normal text-muted-foreground">Manage patient photos and track treatment progress.</span></span></Link></Button>
          <Button variant="link" className="w-full" onClick={() => setMode('signin')}>I already have an account</Button>
        </div> : mode === "choose" && <div className="space-y-2.5">
          {!search.clinician && <><button type="button" disabled={!!busy} onClick={() => { track("onboarding_started", "onboarding", "guest"); void navigate({ to: "/onboarding", replace: true }); }} className="flex w-full items-center justify-center gap-2 rounded-full gradient-rose py-4 text-base font-medium text-primary-foreground shadow-sm disabled:opacity-60">Continue without signing up</button><p className="pt-1 text-center text-xs text-muted-foreground">Or save your results with a free account</p></>}
          <button type="button" disabled={!!busy} onClick={() => social("google")} className={btn}>{busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="font-semibold">G</span>} Continue with Google</button>
          <button type="button" disabled={!!busy} onClick={() => social("apple")} className={btn}>{busy === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <span></span>} Continue with Apple</button>
          <button type="button" disabled={!!busy} onClick={() => setMode("signup")} className={btn}><Mail className="h-4 w-4" /> Sign up with email</button>
          <button type="button" disabled={!!busy} onClick={() => setMode("signin")} className="w-full pt-1 text-sm font-medium text-primary underline underline-offset-2">I already have an account</button>
        </div>}

        {mode === "signup" && <form onSubmit={withEmail} className="space-y-3">
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base text-foreground outline-none focus:border-primary" />
          <input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base text-foreground outline-none focus:border-primary" />
          <button type="submit" disabled={!!busy} className="flex w-full items-center justify-center gap-2 rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {busy === "email" && <Loader2 className="h-4 w-4 animate-spin" />} Create my account</button>
          <button type="button" onClick={() => setMode("choose")} className="w-full text-xs text-muted-foreground">← Other options</button>
        </form>}

        {mode === "signin" && <form onSubmit={withEmail} className="space-y-3">
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base text-foreground outline-none focus:border-primary" />
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base text-foreground outline-none focus:border-primary" />
          <button type="submit" disabled={!!busy} className="flex w-full items-center justify-center gap-2 rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {busy === "email" && <Loader2 className="h-4 w-4 animate-spin" />} Sign in</button>
          <button type="button" onClick={() => setMode("choose")} className="w-full text-xs text-muted-foreground">← Other options</button>
        </form>}

        {mode === "sent" && <div className="space-y-3">
          <p className="text-sm text-foreground">Check your inbox to confirm <b>{email}</b>. Once confirmed, you'll be signed in and your starting point is ready.</p>
          <button type="button" onClick={() => void navigate({ to: "/onboarding", replace: true })} className="w-full rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground">Continue for now</button>
        </div>}

        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-center text-[0.7rem] leading-relaxed text-muted-foreground">
          Your photos and results stay private. See our <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>.
        </p>
        <Button asChild variant="link" size="sm" className="w-full"><Link to="/clinician/onboarding">For Clinicians · Early access</Link></Button>
        <Button asChild variant="link" size="sm" className="w-full"><Link to="/hair/salon/$salonSlug" params={{ salonSlug: "mika-beauty-studio" }}>Hair consultation · Mika Beauty Studio</Link></Button>
      </div>
    </div>
  );
}
