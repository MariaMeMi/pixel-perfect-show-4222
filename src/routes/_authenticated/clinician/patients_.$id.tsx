import {createFileRoute} from '@tanstack/react-router';
import {queryOptions,useSuspenseQuery} from '@tanstack/react-query';
import {patientDetail} from '@/lib/clinician/portal.functions';
import {clinicianHead} from '@/lib/clinician/rules';
import {PatientWorkspace} from '@/components/clinician/PatientWorkspace';
const detailOptions=(id:string)=>queryOptions({queryKey:['clinician','patient',id],queryFn:()=>patientDetail({data:{id}})});
export const Route=createFileRoute('/_authenticated/clinician/patients_/$id')({head:()=>clinicianHead('Patient record','Private test photo timeline, subjective progress, and treatment documentation.'),loader:({context,params})=>context.queryClient.ensureQueryData(detailOptions(params.id)),component:PatientPage});
function PatientPage(){const {id}=Route.useParams();const {data}=useSuspenseQuery(detailOptions(id));return <PatientWorkspace detail={data}/>}
