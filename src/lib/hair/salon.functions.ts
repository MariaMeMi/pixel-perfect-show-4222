import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { answersSchema, resultSchema, newResultSchema, settingsSchema, capabilitySchema, contactSchema, consentText, noticeVersion, statuses, brands, httpsUrl, salonLanguageSchema, salonLanguageNames } from './rules';
import { inventorySchema, selectInventory, completeInventory } from './inventory';
import type { Database } from '@/integrations/supabase/types';

const slugSchema=z.object({slug:z.string().regex(/^[a-z0-9-]{1,80}$/)});
async function hash(value:string) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join(''); }
function publicClient() {
 const url=process.env['SUPABASE_URL']; const key=process.env['SUPABASE_PUBLISHABLE_KEY'] ?? process.env['SUPABASE_ANON_KEY'];
 if(!url||!key) throw new Error('Salon service is temporarily unavailable');
 return createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers); if(key.startsWith('sb_'))headers.delete('Authorization');headers.set('apikey',key);return fetch(input,{...init,headers});}}});
}
async function salonPublic(slug:string) {
 const db=publicClient(); const {data:salon,error}=await db.from('hair_salons').select('id,slug,name,settings').eq('slug',slug).eq('active',true).single();
 if(error||!salon)throw new Error('This salon consultation is not available.');
 const settings=settingsSchema.parse(salon.settings);
 const {data:products,error:pe}=await db.from('hair_salon_products').select('*').eq('salon_id',salon.id).eq('active',true).eq('verified',true);
 if(pe)throw new Error('Could not load the salon catalog');
 const {data:references,error:re}=await db.from('hair_product_references').select('*').eq('verified',true).eq('kind','product');
 if(re)throw new Error('Could not load the salon catalog');
 return {salon:{...salon,settings},references:references??[],products:(products??[]).filter(p=>p.enabled&&p.available&&completeInventory(p)&&references?.some(r=>r.id===p.reference_id)&&settings.enabledBrands.some(b=>b===p.brand))};
}
export const getSalon=createServerFn({method:'GET'}).inputValidator((v:unknown)=>slugSchema.parse(v)).handler(async({data})=>salonPublic(data.slug));
async function limitedAdmin(action:string,limit=20) {
 const {supabaseAdmin:db}=await import('@/integrations/supabase/client.server');
 const request=getRequest(); const ip=request.headers.get('cf-connecting-ip')??request.headers.get('x-forwarded-for')?.split(',')[0]??'unknown';
 const {data:ok,error}=await db.rpc('hair_consume_limit',{k:`${action}:${await hash(ip)}`,max_requests:limit,seconds:3600});
 if(error||!ok)throw new Error('Too many requests. Please try again later.');
 return db;
}
async function guest(data:z.infer<typeof capabilitySchema>) {
 const db=await limitedAdmin('guest',180);
 const {data:row,error}=await db.from('hair_consultations').select('*').eq('id',data.id).eq('secret_hash',await hash(data.secret)).gt('expires_at',new Date().toISOString()).single();
 if(error||!row)throw new Error('This consultation link has expired or is unavailable. Please start a new consultation.');
 const {data:salon}=await db.from('hair_salons').select('id,slug,name,settings').eq('id',row.salon_id).eq('active',true).single();
 if(!salon)throw new Error('Salon unavailable');
 return {db,row,salon:{...salon,settings:settingsSchema.parse(salon.settings)}};
}
export const generateHairRoutine=createServerFn({method:'POST'}).inputValidator((v:unknown)=>slugSchema.extend({answers:answersSchema,lang:salonLanguageSchema,sessionId:z.string().uuid()}).parse(v)).handler(async({data})=>{
 const db=await limitedAdmin('hair-analysis',12); const {salon,products,references}=await salonPublic(data.slug);
 const key=process.env['LOVABLE_API_KEY'];if(!key)throw new Error('Hair consultations are temporarily unavailable.');
 const {createOpenAI}=await import('@ai-sdk/openai');const {streamText}=await import('ai');
 const openai=createOpenAI({apiKey:key,baseURL:'https://ai.gateway.lovable.dev/v1'});
 const response=streamText({model:openai('openai/gpt-6-astra'),system:`You are a cautious cosmetic hair-care assistant. Respond in ${salonLanguageNames[data.lang]}. Use only questionnaire answers; no photos were inspected. No diagnosis, prescriptions, invented ingredients, specific products, prices or availability. Avoid promising repair or growth. Provide gentle practical cosmetic routine guidance, mention a qualified professional for persistent scalp discomfort or sudden hair loss. Never import skin data. Return only JSON: {"summary":string,"routine":[{"title":string,"instruction":string}],"advice":string}. Use 1-4 routine steps only: shampoo, conditioner, optional mask, optional leave-in or heat protectant. Never force optional steps when unnecessary. Do not add separate styling or drying steps.`,prompt:JSON.stringify(data.answers)});
 let result;try{const raw=await response.text;result=newResultSchema.parse(JSON.parse(raw.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'')));}catch{throw new Error('We could not prepare your routine. Please try again.');}
 const secret=[...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');
 const chosen=selectInventory(products,references,data.answers);
 const stored={...result,productIds:chosen.map(p=>p.id)};
 const {data:row,error}=await db.from('hair_consultations').insert({salon_id:salon.id,secret_hash:await hash(secret),answers:data.answers,result:stored}).select('id').single();
 if(error||!row)throw new Error('Could not save your consultation.');
 await db.from('hair_salon_events').insert({salon_id:salon.id,session_id:data.sessionId,event:'analysis_completed',concern:data.answers.concern});
 return {id:row.id,secret,result,products:chosen};
});
export const completeHairContact=createServerFn({method:'POST'}).inputValidator((v:unknown)=>capabilitySchema.extend({contact:contactSchema.nullable(),sessionId:z.string().uuid()}).parse(v)).handler(async({data})=>{
 const {db,row,salon}=await guest(data);
 if(!data.contact){const {data:existing}=await db.from('hair_salon_leads').select('id').eq('hair_profile_id',row.id).maybeSingle();if(existing)throw new Error('Contact details were already shared for this consultation.');await db.from('hair_consultations').update({contact_skipped:true}).eq('id',row.id);await db.from('hair_salon_events').insert({salon_id:salon.id,session_id:data.sessionId,event:'contact_skipped'});return {shared:false,email:'not_requested'};}
 const c=data.contact;const now=new Date().toISOString();
 const evidence={service:consentText(salon.name),email:`I'd like to receive promotions, product recommendations, and special offers from ${salon.name} by email.`,smsEnabled:false,requestReport:c.requestReport};
 const {error}=await db.from('hair_salon_leads').upsert({salon_id:salon.id,hair_profile_id:row.id,first_name:c.firstName,email:c.email,phone_number:c.phone,consultation_data_sharing_consent:true,consultation_consent_timestamp:now,email_marketing_consent:c.emailConsent,email_marketing_consent_timestamp:c.emailConsent?now:null,sms_marketing_consent:false,sms_marketing_consent_timestamp:null,consent_notice_version:noticeVersion,consent_source:`/hair/salon/${salon.slug}`,consent_evidence:evidence,consultation_answers:row.answers},{onConflict:'hair_profile_id',ignoreDuplicates:true});
 if(error)throw new Error('Your details could not be shared. Please try again.');
 await db.from('hair_salon_events').insert({salon_id:salon.id,session_id:data.sessionId,event:'contact_submitted'});
 let email='not_requested';
 if(c.requestReport){
  const {data:saved}=await db.from('hair_salon_leads').select('email,first_name,consent_evidence').eq('hair_profile_id',row.id).single();
  const ev=saved?.consent_evidence as {requestReport?:boolean}|undefined;
  if(saved&&ev?.requestReport){try{const {sendTemplateEmail}=await import('@/lib/email-templates/send-email'); const {products}=await salonPublic(salon.slug); const stored=row.result as {productIds?:string[]};const r=await sendTemplateEmail('hair-routine',saved.email,{templateData:{name:saved.first_name,salon:salon.name,result:resultSchema.parse(row.result),products:products.filter(p=>stored.productIds?.includes(p.id)).map(p=>p.name),bookingUrl:salon.settings.bookingUrl},idempotencyKey:`hair-report-${row.id}`});email=r.sent?'sent':'suppressed';}catch{email='failed';}}
 }
 return {shared:true,email};
});
export const deleteGuestConsultation=createServerFn({method:'POST'}).inputValidator((v:unknown)=>capabilitySchema.parse(v)).handler(async({data})=>{const {db,row}=await guest(data);const {error}=await db.from('hair_consultations').delete().eq('id',row.id);if(error)throw new Error('Could not delete your consultation.');return {deleted:true};});
export const salonEvent=createServerFn({method:'POST'}).inputValidator((v:unknown)=>slugSchema.extend({sessionId:z.string().uuid(),event:z.enum(['landing_view','onboarding_start','contact_view','product_view','product_click','booking_click']),productId:z.string().uuid().optional()}).parse(v)).handler(async({data})=>{
 const db=await limitedAdmin('hair-events',300);const {salon,products}=await salonPublic(data.slug);
 if(data.productId&&!products.some(p=>p.id===data.productId))throw new Error('Product unavailable');
 const {data:old}=await db.from('hair_salon_events').select('id').eq('salon_id',salon.id).eq('session_id',data.sessionId).eq('event',data.event).limit(1);
 if(!old?.length||data.productId)await db.from('hair_salon_events').insert({salon_id:salon.id,session_id:data.sessionId,event:data.event,product_id:data.productId??null});return {ok:true};
});
export const salonAdminOverview=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const {data:members,error}=await context.supabase.from('hair_salon_admins').select('salon_id');if(error)throw new Error('Could not load salon access');
 const ids=(members??[]).map(m=>m.salon_id);if(!ids.length)return {salons:[],products:[],leads:[],events:[],references:[]};
 const [s,p,l,e]=await Promise.all([context.supabase.from('hair_salons').select('*').in('id',ids),context.supabase.from('hair_salon_products').select('*').in('salon_id',ids),context.supabase.from('hair_salon_leads').select('*').in('salon_id',ids).order('created_at',{ascending:false}),context.supabase.from('hair_salon_events').select('*').in('salon_id',ids).order('created_at',{ascending:false}).limit(10000)]);
 const {data:references,error:re}=await context.supabase.from('hair_product_references').select('*').order('brand').order('name');
 if(s.error||p.error||l.error||e.error||re)throw new Error('Could not load salon workspace');return {references:references??[],salons:(s.data??[]).map(x=>({...x,settings:settingsSchema.parse(x.settings)})),products:p.data??[],leads:l.data??[],events:e.data??[]};
});
export const saveSalonSettings=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(150),settings:settingsSchema}).parse(v)).handler(async({data,context})=>{const {data:row,error}=await context.supabase.from('hair_salons').update({name:data.name,settings:data.settings}).eq('id',data.id).select('id').single();if(error||!row)throw new Error('Salon unavailable or access denied');return {ok:true};});
export const updateHairLead=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({id:z.string().uuid(),status:z.enum(statuses),emailConsent:z.boolean().optional()}).parse(v)).handler(async({data,context})=>{const change:{lead_status:typeof data.status;email_marketing_consent?:false}={lead_status:data.status};if(data.emailConsent===false)change.email_marketing_consent=false;const {data:row,error}=await context.supabase.from('hair_salon_leads').update(change).eq('id',data.id).select('id').single();if(error||!row)throw new Error('Lead unavailable or access denied');return {ok:true};});
export const deleteHairLead=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({id:z.string().uuid()}).parse(v)).handler(async({data,context})=>{
 const {data:lead}=await context.supabase.from('hair_salon_leads').select('id,hair_profile_id,salon_id').eq('id',data.id).single();if(!lead)throw new Error('Lead unavailable or access denied');
 const {supabaseAdmin:db}=await import('@/integrations/supabase/client.server');const {error}=await db.from('hair_consultations').delete().eq('id',lead.hair_profile_id).eq('salon_id',lead.salon_id);if(error)throw new Error('Could not delete customer data');return {ok:true};
});
export const saveSalonProduct=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>inventorySchema.parse(v)).handler(async({data,context})=>{
 const {data:membership,error:me}=await context.supabase.from('hair_salon_admins').select('salon_id').eq('salon_id',data.salonId).maybeSingle();
 if(me||!membership)throw new Error('Salon unavailable or access denied');
 const {data:reference,error:re}=await context.supabase.from('hair_product_references').select('*').eq('id',data.referenceId).eq('verified',true).eq('kind','product').single();
 if(re||!reference?.category)throw new Error('Select a verified individual product reference.');
 const row={salon_id:data.salonId,reference_id:reference.id,name:reference.name,brand:reference.brand,function:reference.category,description:reference.description,concerns:[],purchase_url:data.purchaseUrl,price:data.price,size:data.size,image_url:data.imageUrl,image_source:data.imageSource,verified:true,active:true,enabled:data.enabled,available:data.available};
 const q=data.id?context.supabase.from('hair_salon_products').update(row).eq('id',data.id).eq('salon_id',data.salonId):context.supabase.from('hair_salon_products').insert(row);
 const {data:saved,error}=await q.select('id').single();if(error||!saved)throw new Error('Could not save this verified product');return {ok:true};
});
