import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createPlusCheckout, restorePlusAccess, verifyPlusCheckout } from "@/lib/plus.functions";
import { usePlus } from "@/hooks/usePlus";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/plus")({
  validateSearch: (s: Record<string, unknown>): { session_id?: string } => ({
    ...(typeof s["session_id"] === "string" ? { session_id: s["session_id"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Rosea Plus — 1 year of your full skin journey" },
      { name: "description", content: "Unlock full skin history, progress comparisons, treatment tracking and pattern insights for $14.99 a year." },
      { property: "og:title", content: "Rosea Plus — 1 year of your full skin journey" },
      { property: "og:description", content: "Full skin history, comparisons and pattern insights for $14.99 / 1 year." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlusPage,
});

const FEATURES = ["Full skin history", "Progress comparisons", "Treatment tracking", "Pattern insights"];

function PlusPage() {
  const { session_id } = Route.useSearch();
  const plus = usePlus();
  const createFn = useServerFn(createPlusCheckout);
  const verifyFn = useServerFn(verifyPlusCheckout);
  const restoreFn = useServerFn(restorePlusAccess);
  const [checkout, setCheckout] = useState(false);
  const [busy, setBusy] = useState<"verify" | "restore" | null>(session_id ? "verify" : null);
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    if (!session_id) return;
    void (async () => {
      try {
        const r = await verifyFn({ data: { sessionId: session_id, environment: getStripeEnvironment() } });
        if ("error" in r) throw new Error(r.error);
        if (r.plus) { setWelcome(true); plus.refresh(); }
        else toast.error("Payment wasn't completed, so your plan hasn't changed.");
      } catch { toast.error("We couldn't confirm the payment. Try Restore access."); }
      finally {
        setBusy(null);
        window.history.replaceState(null, "", "/plus");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session_id]);

  async function restore() {
    setBusy("restore");
    try {
      const r = await restoreFn({ data: { environment: getStripeEnvironment() } });
      if ("error" in r) throw new Error(r.error);
      if (r.plus) { setWelcome(true); plus.refresh(); }
      else toast("No active Rosea Plus purchase found for this account.");
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setBusy(null); }
  }

  const fetchClientSecret = async () => {
    const r = await createFn({ data: { environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/plus?session_id={CHECKOUT_SESSION_ID}` } });
    if ("error" in r) throw new Error(r.error);
    return r.clientSecret;
  };

  const expiry = plus.expiresAt ? new Date(plus.expiresAt).toLocaleDateString() : "";

  return (
    <div className="animate-rise space-y-6">
      <PaymentTestModeBanner />

      {welcome || (plus.isPlus && !checkout) ? (
        <div className="surface-lift gradient-dawn space-y-3 p-7 text-center">
          <h1 className="font-display text-[2rem] leading-tight text-foreground">Welcome to Rosea Plus 🌹</h1>
          <p className="text-sm text-secondary-foreground">Your full skin journey is unlocked.</p>
          {expiry && <p className="text-xs text-muted-foreground">Access until {expiry}</p>}
          <Link to="/progress" className="mt-2 inline-block rounded-full gradient-rose px-6 py-3 text-sm font-medium text-primary-foreground">See my progress</Link>
        </div>
      ) : (
        <div className="surface-lift gradient-dawn space-y-5 p-7">
          <div className="text-center">
            <h1 className="font-display text-[2rem] leading-tight text-foreground">Rosea Plus 🌹</h1>
            <p className="mt-2 text-lg text-foreground">$14.99 <span className="text-sm text-muted-foreground">/ 1 year</span></p>
          </div>
          <ul className="space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                <Check className="h-4 w-4 text-primary" strokeWidth={2} /> {f}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">One-time payment. No automatic renewal.</p>

          {busy === "verify" ? (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Confirming your payment…</p>
          ) : plus.loading ? null : !plus.signedIn ? (
            <Link to="/welcome" className="block w-full rounded-full gradient-rose py-4 text-center text-sm font-medium text-primary-foreground">Sign in to unlock Rosea Plus</Link>
          ) : checkout ? (
            <div className="overflow-hidden rounded-2xl bg-card">
              <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          ) : (
            <button onClick={() => setCheckout(true)} className="w-full rounded-full gradient-rose py-4 text-sm font-medium text-primary-foreground">
              Unlock Rosea Plus — $14.99
            </button>
          )}

          {plus.signedIn && !checkout && busy !== "verify" && (
            <button onClick={restore} disabled={busy === "restore"} className="flex w-full items-center justify-center gap-2 text-sm text-primary underline underline-offset-2 disabled:opacity-60">
              {busy === "restore" && <Loader2 className="h-4 w-4 animate-spin" />} Restore access
            </button>
          )}
        </div>
      )}
    </div>
  );
}
