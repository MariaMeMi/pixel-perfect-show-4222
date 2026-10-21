import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { libraryOverview } from "@/lib/clinician/library.functions";
import { clinicianHead } from "@/lib/clinician/rules";
import { SectionTitle } from "@/components/clinician/Shell";
import { AddCaseButton, CaseList } from "@/components/clinician/Cases";
export const libraryOptions = queryOptions({ queryKey: ["clinician", "library"], queryFn: () => libraryOverview() });
export const Route = createFileRoute("/_authenticated/clinician/cases")({
  head: () => clinicianHead("My Cases", "Private longitudinal clinical test cases, archived history and follow-up documentation."),
  loader: ({ context }) => context.queryClient.ensureQueryData(libraryOptions), component: Cases,
});
function Cases() { const { data } = useSuspenseQuery(libraryOptions); return <><SectionTitle title="My Cases" subtitle="Clinical case records" action={<AddCaseButton patients={data.patients} />} /><CaseList cases={data.cases} patients={data.patients} /></>; }