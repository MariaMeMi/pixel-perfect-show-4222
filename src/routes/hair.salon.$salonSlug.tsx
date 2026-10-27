import { createFileRoute } from '@tanstack/react-router';
import { getSalon } from '@/lib/hair/salon.functions';
import { SalonExperience } from '@/components/hair/SalonExperience';
export const Route=createFileRoute('/hair/salon/$salonSlug')({
 loader:({params})=>getSalon({data:{slug:params.salonSlug}}),
 head:({loaderData})=>({meta:[{title:`${loaderData?.salon.name??'Salon'} Hair Consultation | Rose AI`},{name:'description',content:'Discover your hair profile and a personalized cosmetic hair care routine with optional contact sharing.'},{property:'og:title',content:`${loaderData?.salon.name??'Salon'} Hair Consultation`},{property:'og:description',content:'Your hair profile, personalized routine, and verified salon products.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'},...(loaderData?.salon.settings.coverUrl?[{property:'og:image',content:loaderData.salon.settings.coverUrl},{name:'twitter:image',content:loaderData.salon.settings.coverUrl}]:[])]}),
 component:()=>{const data=Route.useLoaderData();return <SalonExperience data={data}/>;},
 errorComponent:({error})=><div className="mx-auto max-w-xl px-6 py-16"><h1 className="text-3xl">Salon consultation unavailable</h1><p className="mt-4">{error instanceof Error?error.message:'Please try again later.'}</p></div>,
});