import { describe, expect, it } from 'vitest';
import { categoryName, isPublicProduct, recordedSpf, rankCatalog, matchingReasons, noPreferences, type CatalogProduct } from './catalog';
import { pickProducts } from '@/lib/routine/engine';
const product = (patch: Partial<CatalogProduct>): CatalogProduct => ({ id: 'a', name: 'Cream', brand: 'Brand', category: 'moisturizer', subcategory: '', active: true, verification_status: 'verified', concerns: [], price_tier: 1, approx_price: null, fragrance_free: null, rank: 1, sponsored: false, purpose: '', best_for: '', why: '', key_ingredients: [], image_url: null, normal_url: null, affiliate_url: null, created_at: '', verification_note: '', irritation_notes: '', shades: [], finish: '', coverage: '', normalized_key: null, ...patch });
describe('verified product library', () => {
  it('allows only active verified products', () => {
    expect([product({}), product({ id: 'b', active: false }), product({ id: 'c', verification_status: 'pending' })].filter(isPublicProduct).map(p => p.id)).toEqual(['a']);
  });
  it('ranking retains every verified product, including nonmatches', () => {
    const rows = [product({ id: 'other' }), product({ id: 'match', concerns: ['redness'] })];
    expect(rankCatalog(rows, { ...noPreferences, tags: ['redness'] }).map(p => p.id)).toEqual(['match', 'other']);
  });
  it('reuses the existing routine best match without changing its algorithm', () => {
    const rows = [product({ id: 'ordinary' }), product({ id: 'matching', concerns: ['redness'], fragrance_free: true })];
    expect(rankCatalog(rows, { ...noPreferences, tags: ['redness'], budget: 1 })[0]?.id).toBe(pickProducts(rows, 'moisturizer', ['redness'], 1).best?.id);
  });
  it('does not infer SPF when it is absent from recorded data', () => {
    expect(recordedSpf(product({ name: 'Tinted sunscreen' }))).toBeNull();
    expect(recordedSpf(product({ name: 'Mineral Sunscreen SPF 50+' }))).toBe(50);
  });
  it('uses existing complexion subcategories without duplicating tinted SPF', () => {
    expect(categoryName(product({ category: 'complexion', subcategory: 'tinted sunscreen' }))).toBe('Tinted SPF');
    expect(categoryName(product({ category: 'complexion', subcategory: 'bb cream' }))).toBe('BB & CC Creams');
  });
  it('does not offer personal recommendation reasons with urgent symptoms', () => {
    expect(matchingReasons(product({ concerns: ['redness'], fragrance_free: true }), { ...noPreferences, tags: ['redness'], urgent: true })).toEqual([]);
  });
});