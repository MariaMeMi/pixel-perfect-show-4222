import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { libraryOptions } from "./cases";
import { clinicianHead } from "@/lib/clinician/rules";
import { SectionTitle } from "@/components/clinician/Shell";
import { PhotoLibrary } from "@/components/clinician/PhotoLibrary";
export const Route = createFileRoute("/_authenticated/clinician/photos")({
  head: () => clinicianHead("Photo Library", "Authorized private test photos, dates, tags, case filters and before-and-after comparisons."),
  loader: ({ context }) => context.queryClient.ensureQueryData(libraryOptions), component: Photos,
});
function Photos() { const { data } = useSuspenseQuery(libraryOptions); return <><SectionTitle title="Photo Library" subtitle="Private photographs" /><PhotoLibrary library={data} /></>; }