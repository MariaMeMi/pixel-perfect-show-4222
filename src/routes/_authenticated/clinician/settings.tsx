import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { requestDeletion } from "@/lib/clinician/portal.functions";
import { clinicianHead } from "@/lib/clinician/rules";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/clinician/Shell";
export const Route = createFileRoute("/_authenticated/clinician/settings")({
  head: () =>
    clinicianHead(
      "Settings",
      "Clinician account details, privacy acknowledgments, and deletion requests.",
    ),
  component: Settings,
});
function Settings() {
  const profile = Route.useRouteContext().clinician;
  const cache = useQueryClient(),
    navigate = useNavigate(),
    request = useServerFn(requestDeletion);
  const [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false);
  return (
    <>
      <SectionTitle title="Settings" subtitle="Account and privacy" />
      <section className="max-w-2xl">
        <h2 className="font-sans text-lg font-semibold">Professional profile</h2>
        <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
          {[
            ["Name", profile.full_name],
            ["Professional role", profile.professional_role],
            ["Clinic", profile.clinic_name || "Not specified"],
            ["Country", profile.country],
            ["Account email", profile.professional_email],
            ["Verification", "Unverified · self-selected"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="mt-1 break-words font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="my-8 flex items-start gap-3 border-y border-border py-5">
          <ShieldCheck className="size-5 shrink-0 text-primary" />
          <div>
            <h3 className="font-sans text-sm font-semibold">Private test workspace</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Only this account can access its records. Photos use temporary private viewing links.
              Access does not verify medical credentials or establish healthcare compliance.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await cache.cancelQueries();
            cache.clear();
            await supabase.auth.signOut();
            await navigate({ to: "/welcome", replace: true });
          }}
        >
          <LogOut />
          Sign out
        </Button>
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="font-sans text-lg font-semibold">Account / data deletion request</h2>
          <p className="my-3 text-sm text-muted-foreground">
            Submit a request for review. This does not immediately delete records; retention
            requirements must be reviewed before removal.
          </p>
          {sent ? (
            <p role="status" className="text-sm text-primary">
              Request recorded as pending. No data has been deleted.
            </p>
          ) : (
            <Button
              disabled={busy}
              variant="outline"
              onClick={async () => {
                if (!confirm("Submit an account and data deletion request?")) return;
                setBusy(true);
                try {
                  await request();
                  setSent(true);
                } catch {
                  toast.error("Could not submit request");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 />
              {busy ? "Submitting…" : "Request account / data deletion"}
            </Button>
          )}
        </section>
      </section>
    </>
  );
}
