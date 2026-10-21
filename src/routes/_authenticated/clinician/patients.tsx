import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { overviewOptions } from "./dashboard";
import { clinicianHead } from "@/lib/clinician/rules";
import { SectionTitle } from "@/components/clinician/Shell";
import { AddPatientButton, PatientList } from "@/components/clinician/Patients";
export const Route = createFileRoute("/_authenticated/clinician/patients")({
  head: () => clinicianHead("Patients", "Manage your own non-identifying patient test records."),
  loader: ({ context }) => context.queryClient.ensureQueryData(overviewOptions),
  component: Patients,
});
function Patients() {
  const { data } = useSuspenseQuery(overviewOptions);
  return (
    <>
      <SectionTitle
        title="Patients"
        subtitle="Private, account-scoped test records."
        action={<AddPatientButton />}
      />
      <PatientList patients={data.patients} />
    </>
  );
}
