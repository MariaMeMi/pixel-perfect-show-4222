import { describe, expect, it } from 'vitest';
import { selectInventory, inventorySchema, MAX_RECOMMENDED_PRODUCTS, MAX_ROUTINE_STEPS, type InventoryProduct, type ProductReference } from './inventory';
import { newResultSchema, type HairAnswers } from './rules';
const answers: HairAnswers = { texture: 'Wavy', thickness: 'Fine', scalp: 'Balanced', concern: 'Dryness', goal: 'Softness and shine', color: 'Natural', washing: 'Every 2–3 days', heat: 'Occasionally' };
const reference: ProductReference = { id: 'ref', verified: true, kind: 'product', category: 'Shampoo', suitability: { concerns: ['Dryness'], scalps: ['Balanced'] } };
const product: InventoryProduct = { id: 'a', reference_id: '00000000-0000-4000-8000-000000000001', verified: true, active: true, enabled: true, available: true, function: 'Shampoo', price: '$30', size: '250 ml', purchase_url: 'https://example.com/product', image_url: 'https://example.com/image.jpg', image_source: 'Approved manufacturer source' };
const ref = { ...reference, id: product.reference_id ?? '' };
const choose = (p: InventoryProduct = product, r: ProductReference = ref, a = answers) => selectInventory([p], [r], a);
describe('verified hair inventory recommendations', () => {
  it('excludes collections from purchasable recommendations', () => expect(choose(product, { ...ref, kind: 'collection' })).toEqual([]));
  it('requires a verified reference', () => expect(choose(product, { ...ref, verified: false })).toEqual([]));
  it('requires verified inventory', () => expect(choose({ ...product, verified: false })).toEqual([]));
  it('requires enabled salon stock', () => expect(choose({ ...product, enabled: false })).toEqual([]));
  it('requires availability', () => expect(choose({ ...product, available: false })).toEqual([]));
  it('recommends without price, size or image when a secure purchase link exists', () => {
    for (const field of ['price', 'size', 'image_url', 'image_source'] as const) expect(choose({ ...product, [field]: '' })).toEqual([expect.objectContaining({ id: 'a' })]);
    expect(choose({ ...product, purchase_url: '' })).toEqual([]);
  });
  it('never fills routine slots with unsuitable products', () => expect(choose(product, ref, { ...answers, concern: 'Color maintenance' })).toEqual([]));
  it('does not assume sensitive scalp compatibility', () => expect(choose(product, ref, { ...answers, scalp: 'Sensitive' })).toEqual([]));
  it('respects chemical treatment restrictions', () => expect(choose(product, { ...ref, suitability: { concerns: ['Dryness'], scalps: ['Balanced'], colors: ['Colored'] } })).toEqual([]));
  it('respects texture and strand thickness restrictions', () => {
    expect(choose(product, { ...ref, suitability: { concerns: ['Dryness'], scalps: ['Balanced'], textures: ['Curly'] } })).toEqual([]);
    expect(choose(product, { ...ref, suitability: { concerns: ['Dryness'], scalps: ['Balanced'], thicknesses: ['Coarse'] } })).toEqual([]);
  });
  it('does not prioritize higher prices', () => {
    const p = [{ ...product, id: 'a', price: '$10' }, { ...product, id: 'b', price: '$100' }];
    expect(selectInventory(p, [ref], answers)[0]?.id).toBe('a');
    expect(selectInventory(p.map(v => ({ ...v, price: v.id === 'a' ? '$200' : '$5' })), [ref], answers)[0]?.id).toBe('a');
  });
  it('ranks concern match above goal-only matches', () => {
    const goalRef = { ...ref, id: '00000000-0000-4000-8000-000000000002', suitability: { goals: ['Softness and shine'], scalps: ['Balanced'] } };
    expect(selectInventory([{ ...product, id: 'z' }, { ...product, reference_id: goalRef.id }], [ref, goalRef], answers)[0]?.id).toBe('z');
  });
  it('spreads suitability ties across brands', () => {
    const otherRef = { ...ref, id: '00000000-0000-4000-8000-000000000003', category: 'Conditioner' };
    const shampooA = { ...product, id: 'sa', brand: 'BrandA', function: 'Shampoo', reference_id: '00000000-0000-4000-8000-000000000001' };
    const shampooB = { ...product, id: 'sb', brand: 'BrandB', function: 'Shampoo', reference_id: '00000000-0000-4000-8000-000000000001' };
    const conditioner = { ...product, id: 'ca', brand: 'BrandA', function: 'Conditioner', reference_id: '00000000-0000-4000-8000-000000000003' };
    const result = selectInventory([shampooA, conditioner, shampooB], [ref, otherRef], answers);
    expect(result.find(p => p.function === 'Shampoo')?.brand).toBe('BrandB');
    expect(result.find(p => p.function === 'Conditioner')?.brand).toBe('BrandA');
  });
  it('keeps one product per function and no more than five products', () => {
    const categories = ['Shampoo', 'Conditioner', 'Mask', 'Leave-in'];
    const products = categories.flatMap((functionName, i) => [0, 1].map(n => ({ ...product, id: `${i}-${n}`, function: functionName, reference_id: `00000000-0000-4000-8000-00000000000${i + 1}` })));
    const references = categories.map((category, i) => ({ ...ref, id: `00000000-0000-4000-8000-00000000000${i + 1}`, category }));
    const result = selectInventory(products, references, answers);
    expect(result).toHaveLength(4); expect(new Set(result.map(p => p.function)).size).toBe(4); expect(result.length).toBeLessThanOrEqual(MAX_RECOMMENDED_PRODUCTS); expect(MAX_RECOMMENDED_PRODUCTS).toBe(5);
  });
  it('does not force an optional mask or leave-in', () => {
    expect(choose({ ...product, function: 'Mask' }, { ...ref, category: 'Mask', suitability: { goals: ['More volume'], scalps: ['Balanced'] } }, { ...answers, concern: 'Flatness', goal: 'More volume' })).toEqual([]);
  });
  it('caps new routines at four steps', () => {
    const base = { summary: 'Summary', advice: 'General care', routine: Array.from({ length: 4 }, () => ({ title: 'Step', instruction: 'Care' })) };
    expect(MAX_ROUTINE_STEPS).toBe(4); expect(newResultSchema.safeParse(base).success).toBe(true); expect(newResultSchema.safeParse({ ...base, routine: [...base.routine, base.routine[0]] }).success).toBe(false);
  });
  it('rejects insecure purchase links in inventory submissions', () => expect(inventorySchema.safeParse({ salonId: product.reference_id, referenceId: product.reference_id, price: '$30', size: '250ml', purchaseUrl: 'http://example.com', imageUrl: product.image_url, imageSource: 'Approved', enabled: true, available: true }).success).toBe(false));
});