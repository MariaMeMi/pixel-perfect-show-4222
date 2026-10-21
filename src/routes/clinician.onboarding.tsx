import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Flower2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { enrollClinician, clinicianStatus } from "@/lib/clinician/portal.functions";
import { clinicianHead } from "@/lib/clinician/rules";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/clinician/Fields";
export const Route = createFileRoute("/clinician/onboarding")({
  head: () =>
    clinicianHead(
      "Clinician early access",
      "Create an unverified, test-data-only clinician workspace.",
    ),
  component: ClinicianOnboarding,
});
function ClinicianOnboarding() {
  const navigate = useNavigate(),
    enroll = useServerFn(enrollClinician),
    status = useServerFn(clinicianStatus);
  const [signedIn, setSignedIn] = useState(false),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [email, setEmail] = useState("");
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setSignedIn(!!data.user);
      setEmail(data.user?.email ?? "");
      if (data.user) {
        const p = await status();
        if (p) {
          void navigate({ to: "/clinician/dashboard", replace: true });
          return;
        }
      }
      setReady(true);
    })().catch(() => setReady(true));
    return () => {
      active = false;
    };
  }, [navigate, status]);
  if (!ready) return <p className="p-8 text-muted-foreground">Loading…</p>;
  return (
    <div className="clinician-workspace mx-auto max-w-xl px-5 py-12">
      <Link to="/welcome" className="flex items-center gap-2 text-lg font-semibold">
        <Flower2 className="text-primary" />
        Rose AI <span className="text-muted-foreground">for Clinicians</span>
      </Link>
      <p className="mt-10 text-xs font-semibold text-primary">EARLY ACCESS · TEST DATA ONLY</p>
      <h1 className="mt-3 font-sans text-3xl font-semibold">Your clinician workspace</h1>
      <p className="mb-8 mt-3 text-sm text-muted-foreground">
        Professional access is self-selected and unverified. Do not upload real patient photos or
        medical information.
      </p>
      {!signedIn ? (
        <div className="space-y-4">
          <p className="text-sm">
            Create an account or sign in with your professional email to continue.
          </p>
          <Button asChild>
            <Link to="/welcome" search={{ clinician: true }}>
              Create account / Sign in
            </Link>
          </Button>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            try {
              await enroll({
                data: {
                  name: String(f.get("name")),
                  role: String(f.get("role")) as
                    "Dermatologist" | "Aesthetic Practitioner" | "Other",
                  clinic: String(f.get("clinic")),
                  country: String(f.get("country")),
                  privacy: (f.get("privacy") === "on") as true,
                  testOnly: (f.get("test") === "on") as true,
                },
              });
              await navigate({ to: "/clinician/dashboard", replace: true });
            } catch {
              toast.error("Could not complete onboarding. Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Full name">
            <input name="name" required maxLength={120} className={fieldClass} />
          </Field>
          <Field label="Professional role">
            <select name="role" className={fieldClass}>
              {["Dermatologist", "Aesthetic Practitioner", "Other"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Clinic name (optional)">
            <input name="clinic" maxLength={160} className={fieldClass} />
          </Field>
          <Field label="Country">
            <input name="country" required maxLength={80} className={fieldClass} />
          </Field>
          <Field label="Account / professional email">
            <input value={email} readOnly className={fieldClass} />
          </Field>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" required name="privacy" />I acknowledge my patient privacy,
            consent and access responsibilities.
          </label>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" required name="test" />I will use only synthetic photos and
            non-identifying test records. No real patient data.
          </label>
          <Button type="submit" disabled={busy}>
            <ShieldCheck />
            {busy ? "Creating…" : "Create clinician workspace"}
          </Button>
        </form>
      )}
    </div>
  );
}
