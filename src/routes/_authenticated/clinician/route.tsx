import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { clinicianStatus } from "@/lib/clinician/portal.functions";
import { ClinicianShell } from "@/components/clinician/Shell";
export const Route = createFileRoute("/_authenticated/clinician")({
  beforeLoad: async () => {
    const profile = await clinicianStatus();
    if (!profile) throw redirect({ to: "/clinician/onboarding" });
    return { clinician: profile };
  },
  component: () => (
    <ClinicianShell>
      <Outlet />
    </ClinicianShell>
  ),
});
