import { describe,it,expect } from 'vitest';
import { contactSchema, phoneSchema, selectProducts, metrics, csvCell } from './rules';
describe('salon privacy and catalog rules',()=>{
  it('requires service consent for contact sharing',()=>expect(contactSchema.safeParse({firstName:'Test',email:'test@example.com',phone:'+15125550123',serviceConsent:false,emailConsent:false,smsConsent:false,requestReport:false}).success).toBe(false));
  it('leaves marketing optional',()=>expect(contactSchema.parse({firstName:'Test',email:'test@example.com',phone:'(512) 555-0123',serviceConsent:true,emailConsent:false,smsConsent:false,requestReport:false}).emailConsent).toBe(false));
  it('normalizes US phone numbers to E.164',()=>expect(phoneSchema.parse('(512) 555-0123')).toBe('+15125550123'));
  it('blocks SMS consent without a compliant messaging program',()=>expect(contactSchema.safeParse({firstName:'Test',email:'test@example.com',phone:'+15125550123',serviceConsent:true,emailConsent:false,smsConsent:true,requestReport:false}).success).toBe(false));
  it('never recommends unverified or unavailable products',()=>expect(selectProducts([{function:'Shampoo',concerns:[],active:true,verified:false},{function:'Conditioner',concerns:[],active:false,verified:true}], 'Frizz')).toEqual([]));
  it('recommends one product per function',()=>expect(selectProducts([{function:'Shampoo',concerns:[],active:true,verified:true},{function:'Shampoo',concerns:['Frizz'],active:true,verified:true}], 'Frizz')).toHaveLength(1));
  it('booking clicks never become confirmed bookings',()=>expect(metrics([], [{event:'booking_click',session_id:'1'}],new Date('2026-10-27')).bookings).toBe(1));
  it('counts capture using unique contact journeys',()=>expect(metrics([], [{event:'contact_view',session_id:'1'},{event:'contact_view',session_id:'1'},{event:'contact_view',session_id:'2'},{event:'contact_submitted',session_id:'1'}],new Date('2026-10-27')).conversion).toBe(50));
  it('neutralizes formula injection in exports',()=>expect(csvCell('=IMPORTXML("x")')).toBe('"\'=IMPORTXML(""x"")"'));
});