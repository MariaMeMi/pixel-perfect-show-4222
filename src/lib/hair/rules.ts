import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const brands = ["L'Oréal Professionnel", 'Milbon', 'J Beverly Hills', 'Alfaparf Milano', 'Kérastase Paris'] as const;
export const salonLanguageSchema = z.enum(['en', 'de', 'ru', 'uk']);
export const salonLanguageNames = { en: 'English', de: 'German', ru: 'Russian', uk: 'Ukrainian' } as const;
export const statuses = ['New', 'Contacted', 'Consultation Booked', 'Customer', 'Closed'] as const;
export const questions = [
  { key: 'texture', label: 'What is your natural hair texture?', options: ['Straight', 'Wavy', 'Curly', 'Coily'] },
  { key: 'thickness', label: 'How thick are your individual strands?', options: ['Fine', 'Medium', 'Coarse', 'Not sure'] },
  { key: 'scalp', label: 'How does your scalp usually feel?', options: ['Balanced', 'Oily', 'Dry', 'Sensitive'] },
  { key: 'concern', label: 'What is your main hair concern?', options: ['Dryness', 'Frizz', 'Breakage', 'Flatness', 'Color maintenance', 'Scalp comfort'] },
  { key: 'goal', label: 'What would you like from your routine?', options: ['Softness and shine', 'Smoother hair', 'Stronger-feeling hair', 'More volume', 'Color care', 'Defined curls'] },
  { key: 'color', label: 'Is your hair color-treated?', options: ['Natural', 'Colored', 'Bleached or highlighted'] },
  { key: 'washing', label: 'How often do you wash your hair?', options: ['Daily', 'Every 2–3 days', 'Weekly', 'Less often'] },
  { key: 'heat', label: 'How often do you use heated styling tools?', options: ['Never', 'Occasionally', 'Most days'] },
] as const;
export const answersSchema = z.object({
  texture: z.enum(['Straight', 'Wavy', 'Curly', 'Coily']), thickness: z.enum(['Fine', 'Medium', 'Coarse', 'Not sure']),
  scalp: z.enum(['Balanced', 'Oily', 'Dry', 'Sensitive']), concern: z.enum(['Dryness', 'Frizz', 'Breakage', 'Flatness', 'Color maintenance', 'Scalp comfort']),
  goal: z.enum(['Softness and shine', 'Smoother hair', 'Stronger-feeling hair', 'More volume', 'Color care', 'Defined curls']),
  color: z.enum(['Natural', 'Colored', 'Bleached or highlighted']), washing: z.enum(['Daily', 'Every 2–3 days', 'Weekly', 'Less often']), heat: z.enum(['Never', 'Occasionally', 'Most days']),
});
export type HairAnswers = z.infer<typeof answersSchema>;
export const resultSchema = z.object({ summary: z.string().min(1).max(1800), routine: z.array(z.object({ title: z.string().max(100), instruction: z.string().max(700) })).min(2).max(5), advice: z.string().max(700) });
export type HairResult = z.infer<typeof resultSchema>;
// Historical reports can retain their old five-step structure; new reports are capped at four.
export const newResultSchema = resultSchema.extend({ routine: resultSchema.shape.routine.min(1).max(4) });
export const httpsUrl = z.union([z.literal(''), z.string().url().max(1000).refine(v => new URL(v).protocol === 'https:', 'Use a secure https link')]);
export const settingsSchema = z.object({
  description: z.string().max(600).default(''), location: z.string().max(200).default(''), contact: z.string().max(200).default(''), privacyContact: z.union([z.literal(''),z.string().email().max(254)]).default(''),
  bookingUrl: httpsUrl.default(''), purchaseUrl: httpsUrl.default(''), websiteUrl: httpsUrl.default(''), instagramUrl: httpsUrl.default(''), logoUrl: httpsUrl.default(''), coverUrl: httpsUrl.default(''),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#38675a'), accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#eef4ef'),
  enabledBrands: z.array(z.enum(brands)).max(5).default([]),
});
export type SalonSettings = z.infer<typeof settingsSchema>;
export const phoneSchema = z.string().max(40).transform((v, ctx) => {
  const p = parsePhoneNumberFromString(v, 'US');
  if (!p?.isValid()) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please enter a valid phone number, including its country code.' }); return z.NEVER; }
  return p.number;
});
export const contactSchema = z.object({ firstName: z.string().trim().min(1).max(80), email: z.string().trim().email().max(254), phone: phoneSchema, serviceConsent: z.literal(true), emailConsent: z.boolean(), smsConsent: z.literal(false), requestReport: z.boolean() });
export const capabilitySchema = z.object({ id: z.string().uuid(), secret: z.string().regex(/^[a-f0-9]{64}$/) });
export const noticeVersion = 'salon-hair-2026-10-27-v1';
export function consentText(salon: string) { return `I agree to share my name, email address, phone number, and hair consultation answers with ${salon} so they can provide my requested consultation and recommendations.`; }
export function csvCell(v: unknown) { const s = String(v ?? ''); return '"' + (/^[\s]*[=+@\-\t\r]/.test(s) ? "'" + s : s).replaceAll('"','""') + '"'; }
export function metrics(leads: {created_at:string; email_marketing_consent:boolean; sms_marketing_consent:boolean}[], events: {event:string;session_id:string}[], now: Date) {
  const unique = (name:string) => new Set(events.filter(e=>e.event===name).map(e=>e.session_id)).size;
  const views=unique('contact_view');
  return { total: leads.length, month: leads.filter(l => l.created_at.slice(0,7)===now.toISOString().slice(0,7)).length, conversion: views ? Math.round(100*unique('contact_submitted')/views):0, skips: views ? Math.round(100*unique('contact_skipped')/views):0, bookings: unique('booking_click'), email: leads.filter(l=>l.email_marketing_consent).length, sms: leads.filter(l=>l.sms_marketing_consent).length };
}