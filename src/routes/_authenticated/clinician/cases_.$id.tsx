import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { caseDetail } from "@/lib/clinician/library.functions";
import { clinicianHead } from "@/lib/clinician/rules";
import { CaseWorkspace } from "@/components/clinician/CaseWorkspace";
const options = (id: string) => queryOptions({ queryKey: ["clinician", "case", id], queryFn: () => caseDetail({ data: { id } }) });
export const Route = createFileRoute("/_authenticated/clinician/cases_/$id")({
  head: () => clinicianHead("Clinical case", "Private case photos, documents, chronological care records and observations."),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(options(params.id)), component: CasePage,
});
function CasePage() { const { id } = Route.useParams(); const { data } = useSuspenseQuery(options(id)); return <CaseWorkspace detail={data} />; }