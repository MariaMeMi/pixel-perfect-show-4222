import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { PlanPicker, ProFeatures } from "@/components/paywall/ProOffer";
import { usePlus } from "@/hooks/usePlus";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { track } from "@/lib/experiment";
import { createProCheckout, createProPortal, verifyProCheckout } from "@/lib/pro/pro.functions";
import { PRO_PRICES, priceInfo, pricingGroup, type Interval } from "@/lib/pro/pricing";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";

type Search = { plan?: string; back?: "/onboarding" | "/results"; session_id?: string };

export const Route = createFileRoute("/pro")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ...(typeof s["plan"] === "string" && priceInfo(s["plan"]) ? { plan: s["plan"] } : {}),
    ...(s["back"] === "/onboarding" || s["back"] === "/results" ? { back: s["back"] } : {}),
    ...(typeof s["session_id"] === "string" && /^cs_[a-zA-Z0-9_]+$/.test(s["session_id"]) ? { session_id: s["session_id"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Rosea.AI Pro — Rose AI" },
      { name: "description", content: "Unlock your full skin analysis, progress tracking and personalized recommendations with Rosea.AI Pro." },
      { property: "og:title", content: "Rosea.AI Pro — Rose AI" },
      { property: "og:description", content: "Full skin analysis, progress tracking and personalized recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProPage,
});

function ProPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const plus = usePlus();
  const verifyFn = useServerFn(verifyProCheckout);
  const portalFn = useServerFn(createProPortal);
  const [verifying, setVerifying] = useState(!!search.session_id);
  const [justPaid, setJustPaid] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const verified = useRef(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => plus.refresh());
    return () => data.subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!search.session_id || verified.current) return;
    verified.current = true;
    void (async () => {
      try {
        for (let k = 0; k < 10; k++) { const { data } = await supabase.auth.getSession(); if (data.session) break; await new Promise((r) => setTimeout(r, 300)); }
        const r = await verifyFn({ data: { sessionId: search.session_id!, environment: getStripeEnvironment() } });
        if ("error" in r) throw new Error(r.error);
        if (r.pro) {
          setJustPaid(true);
          track(r.group === "premium" ? "pricing_premium_paid" : "pricing_low_paid", "onboarding");
          plus.refresh();
        } else toast.error("Payment wasn't completed, so nothing was charged and your plan hasn't changed.");
      } catch { toast.error("We couldn't confirm the payment yet. Please refresh in a moment."); }
      finally { setVerifying(false); }
    })();
  }, [search.session_id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function manage() {
    setPortalBusy(true);
    try {
      const r = await portalFn({ data: { environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/pro` } });
      if ("error" in r) throw new Error(r.error);
      window.open(r.url, "_blank", "noopener");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't open subscription settings."); }
    finally { setPortalBusy(false); }
  }

  const backBtn = search.back
    ? <Button className="w-full" size="lg" onClick={() => void navigate({ to: search.back! })}>See my full analysis</Button>
    : <Button asChild className="w-full" size="lg"><Link to="/progress">Go to my skin timeline</Link></Button>;

  let body: React.ReactNode;
  if (verifying || plus.loading) {
    body = <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {verifying ? "Confirming your payment…" : "Loading…"}</p>;
  } else if (plus.isPro) {
    body = <div className="surface-lift gradient-dawn space-y-4 p-7 text-center">
      <h1 className="font-display text-[2rem] leading-tight text-foreground">{justPaid ? "Welcome to Rosea.AI Pro 🌹" : "You're on Rosea.AI Pro 🌹"}</h1>
      <p className="text-sm text-secondary-foreground">Your full analysis and Pro features are unlocked.</p>
      {plus.expiresAt && <p className="text-xs text-muted-foreground">{plus.cancelAtPeriodEnd ? "Cancelled — Pro stays active until " : "Renews on "}{new Date(plus.expiresAt).toLocaleDateString()}</p>}
      {backBtn}
      <Button variant="outline" className="w-full" disabled={portalBusy} onClick={() => void manage()}>
        {portalBusy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Manage or cancel subscription
      </Button>
    </div>;
  } else {
    body = <Checkout plan={search.plan} back={search.back} signedIn={plus.signedIn} hasSubscription={plus.hasSubscription} onManage={manage} />;
  }

  return <div className="animate-rise mx-auto max-w-md space-y-6"><PaymentTestModeBanner />{body}</div>;
}

function Checkout({ plan, back, signedIn, hasSubscription, onManage }: { plan?: string; back?: Search["back"]; signedIn: boolean; hasSubscription: boolean; onManage: () => void }) {
  const navigate = useNavigate();
  const createFn = useServerFn(createProCheckout);
  const group = plan ? priceInfo(plan)!.group : pricingGroup();
  const [interval, setInterval] = useState<Interval>(plan ? priceInfo(plan)!.interval : "yearly");
  const [paying, setPaying] = useState(false);
  const priceId = PRO_PRICES[group][interval].id;

  const fetchClientSecret = async () => {
    const qs = new URLSearchParams({ plan: priceId, ...(back ? { back } : {}) });
    const r = await createFn({ data: { priceId, environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/pro?${qs}&session_id={CHECKOUT_SESSION_ID}` } });
    if ("alreadyPro" in r) { window.location.reload(); return ""; }
    if ("error" in r) throw new Error(r.error);
    return r.clientSecret;
  };

  return <div className="space-y-5">
    <div>
      <p className="eyebrow">Rosea.AI Pro</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">Unlock your full analysis</h1>
    </div>
    <section className="surface-lift space-y-4 p-5">
      <ProFeatures />
      {!paying && <PlanPicker group={group} interval={interval} onChange={(i) => { setInterval(i); void navigate({ to: "/pro", search: { plan: PRO_PRICES[group][i].id, ...(back ? { back } : {}) }, replace: true }); }} />}
      {paying && <p className="text-sm text-foreground">{interval === "monthly" ? "Monthly" : "Yearly"} · {PRO_PRICES[group][interval].label}</p>}
    </section>
    {hasSubscription && <button type="button" onClick={onManage} className="w-full text-xs text-primary underline">Have a past subscription? Manage it here</button>}
    {!signedIn ? <SignIn plan={priceId} back={back} />
      : paying ? <div className="overflow-hidden rounded-2xl bg-card">
          <EmbeddedCheckoutProvider key={priceId} stripe={getStripe()} options={{ fetchClientSecret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider>
        </div>
      : <Button className="w-full" size="lg" onClick={() => setPaying(true)}>Pay {PRO_PRICES[group][interval].label} and subscribe</Button>}
  </div>;
}

function SignIn({ plan, back }: { plan: string; back?: Search["back"] }) {
  const [mode, setMode] = useState<"choose" | "signin" | "signup" | "sent">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState("");
  const here = () => `${window.location.origin}/pro?${new URLSearchParams({ plan, ...(back ? { back } : {}) })}`;

  async function social(provider: "google" | "apple") {
    setBusy(provider); setError("");
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: here() });
    if (r.error) { setBusy(undefined); setError("Sign-in didn't complete. Please try again."); }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = z.object({ email: z.string().trim().email().max(255), password: z.string().min(8).max(72) }).safeParse({ email, password });
    if (!p.success) return setError("Enter a valid email and a password of at least 8 characters.");
    setBusy("email"); setError("");
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword(p.data);
      setBusy(undefined);
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ ...p.data, options: { emailRedirectTo: here() } });
      setBusy(undefined);
      if (error) return setError(error.message);
      if (!data.session) setMode("sent");
    }
  }
  const btn = "flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-sm font-semibold text-foreground disabled:opacity-60";
  return <section className="surface space-y-3 p-5">
    <p className="text-sm font-semibold text-foreground">Create an account or sign in so your subscription is linked to you.</p>
    {mode === "choose" && <>
      <button type="button" disabled={!!busy} onClick={() => void social("google")} className={btn}>{busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>G</span>} Continue with Google</button>
      <button type="button" disabled={!!busy} onClick={() => void social("apple")} className={btn}>{busy === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <span></span>} Continue with Apple</button>
      <button type="button" onClick={() => setMode("signup")} className={btn}><Mail className="h-4 w-4" /> Continue with email</button>
    </>}
    {(mode === "signin" || mode === "signup") && <form onSubmit={submit} className="space-y-3">
      <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email"
        className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base text-foreground outline-none focus:border-primary" />
      <input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)" aria-label="Password"
        className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base text-foreground outline-none focus:border-primary" />
      <Button type="submit" className="w-full" disabled={!!busy}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{mode === "signin" ? "Sign in" : "Create account"}</Button>
      <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="w-full text-xs text-muted-foreground underline">
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
    </form>}
    {mode === "sent" && <p className="text-sm text-foreground">Check your inbox to confirm <b>{email}</b>, then come back here to finish.</p>}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </section>;
}
