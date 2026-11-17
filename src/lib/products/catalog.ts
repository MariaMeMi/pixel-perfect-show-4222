import type { Database } from '@/integrations/supabase/types';
import { productMatchScore } from '@/lib/routine/engine';

export type CatalogProduct = Database['public']['Tables']['products']['Row'];
export type Preferences = { tags: string[]; budget: number; sensitive: boolean; rescue: boolean; urgent: boolean };
export const noPreferences: Preferences = { tags: [], budget: 0, sensitive: false, rescue: false, urgent: false };
export const FAVORITES_KEY = 'rose.products.favorites.v1';
export const PREFERENCES_KEY = 'rose.products.preferences.v1';
export const catalogSearchDefaults = { view: 'recommended', q: '', category: '', skin: '', concern: '', brand: '', min: '', max: '', fragrance: false, spf: '', coverage: '', finish: '', sort: 'match', favorites: false, page: 1 };
export const categoryNames = ['Cleansers', 'Toners & Essences', 'Serums', 'Moisturizers & Barrier Creams', 'Masks & Treatments', 'Sunscreen / SPF', 'Foundations', 'BB & CC Creams', 'Cushions', 'Tinted SPF'];
export function categoryName(p: Pick<CatalogProduct, 'category' | 'subcategory'>) {
  if (p.category === 'complexion') {
    if (/tinted sunscreen/i.test(p.subcategory)) return 'Tinted SPF';
    if (/\b(bb|cc) cream/i.test(p.subcategory)) return 'BB & CC Creams';
    if (/cushion/i.test(p.subcategory)) return 'Cushions';
    return 'Foundations';
  }
  if (['cleanser', 'micellar'].includes(p.category)) return 'Cleansers';
  if (p.category === 'toner') return 'Toners & Essences';
  if (['serum', 'calming', 'antioxidant'].includes(p.category)) return 'Serums';
  if (['moisturizer', 'redness_moisturizer', 'rescue'].includes(p.category)) return 'Moisturizers & Barrier Creams';
  if (p.category === 'sunscreen') return 'Sunscreen / SPF';
  return 'Masks & Treatments';
}
// Extract only explicitly recorded SPF, never infer it from category or ingredients.
export function recordedSpf(p: Pick<CatalogProduct, 'name'>) {
  const match = p.name.match(/\bSPF\s*(\d{1,3})\b/i);
  return match ? Number(match[1]) : null;
}
export function isPublicProduct(p: Pick<CatalogProduct, 'active' | 'verification_status'>) { return p.active && ['verified', 'pending'].includes(p.verification_status); }
export function rankCatalog(rows: CatalogProduct[], preferences: Preferences) {
  if (preferences.urgent) return [...rows].sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
  return [...rows].sort((a, b) => Number(a.sponsored) - Number(b.sponsored) || productMatchScore(b, preferences.tags, preferences.budget) - productMatchScore(a, preferences.tags, preferences.budget) || a.id.localeCompare(b.id));
}
export function matchingReasons(p: CatalogProduct, preferences: Preferences) {
  if (preferences.urgent || p.verification_status !== 'verified') return [];
  const reasons: string[] = [];
  if (preferences.sensitive && p.fragrance_free === true) reasons.push('Fragrance-free formula for your sensitivity preference.');
  for (const [tag, text] of [['redness', 'Listed for redness-prone skin.'], ['dryness', 'Listed for dryness support.'], ['sensitive', 'Listed for sensitive skin.'], ['lines', 'Listed for fine-line concerns.'], ['barrier', 'Listed for barrier support.']]) {
    if (tag && text && preferences.tags.includes(tag) && p.concerns.includes(tag)) reasons.push(text);
  }
  if (preferences.budget && p.price_tier <= preferences.budget) reasons.push('Within your selected price tier.');
  return reasons;
}
export function cautions(p: CatalogProduct, preferences: Preferences) {
  const notes = p.irritation_notes ? [p.irritation_notes] : [];
  if (p.fragrance_free === false) notes.push('Not fragrance-free; consider your sensitivities.');
  if (p.fragrance_free === null) notes.push('Fragrance status not recorded.');
  if ((preferences.sensitive || preferences.rescue) && ['anti_aging', 'antioxidant'].includes(p.category)) notes.push('Active ingredients may irritate reactive skin.');
  return notes;
}
export function safeProductUrl(value: string | null) { try { const url = new URL(value ?? ''); return url.protocol === 'https:' ? url.href : undefined; } catch { return undefined; } }