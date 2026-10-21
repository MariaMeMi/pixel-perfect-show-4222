import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { overviewOptions } from "./dashboard";
import { clinicianHead } from "@/lib/clinician/rules";
import { SectionTitle } from "@/components/clinician/Shell";
import { AddPatientButton, PatientList } from "@/components/clinician/Patients";
export const Route = createFileRoute("/_authenticated/clinician/patients")({
  head: () => clinicianHead("My Patients", "Manage your own private longitudinal patient test records and linked cases."),
  loader: ({ context }) => context.queryClient.ensureQueryData(overviewOptions),
  component: Patients,
});
function Patients() {
  const { data } = useSuspenseQuery(overviewOptions);
  return (
    <>
      <SectionTitle
        title="My Patients"
        subtitle="Private, account-scoped test records."
        action={<AddPatientButton />}
      />
      <PatientList patients={data.patients} />
    </>
  );
}
