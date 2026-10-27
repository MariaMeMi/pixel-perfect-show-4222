import { z } from 'zod';
import type { HairAnswers } from './rules';

const secureUrl = z.string().url().max(1000).refine(v => v.startsWith('https://'));
const optionalSecureUrl = z.union([z.literal(''), secureUrl]);
// Retail details (price, size, image) are optional; only a secure purchase link is required.
export const inventorySchema = z.object({
  id: z.string().uuid().optional(), salonId: z.string().uuid(), referenceId: z.string().uuid(),
  price: z.string().trim().max(60).refine(v => v === '' || /[0-9]/.test(v)),
  size: z.string().trim().max(80), purchaseUrl: secureUrl, imageUrl: optionalSecureUrl,
  imageSource: z.string().trim().max(600), enabled: z.boolean(), available: z.boolean(),
});
export const suitabilitySchema = z.object({
  concerns: z.array(z.string()).default([]), goals: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]), scalps: z.array(z.string()).default([]),
  textures: z.array(z.string()).default([]), thicknesses: z.array(z.string()).default([]), heat: z.array(z.string()).default([]),
});
export type ProductReference = { id: string; kind: string; category: string | null; verified: boolean; suitability: unknown };
export type InventoryProduct = {
  id: string; reference_id: string | null; verified: boolean; active: boolean; enabled: boolean; available: boolean;
  function: string; price: string; size: string; purchase_url: string; image_url: string; image_source: string;
};
export const MAX_ROUTINE_STEPS = 4;
export const MAX_RECOMMENDED_PRODUCTS = 5;
export function completeInventory(p: InventoryProduct) {
  return inventorySchema.safeParse({ salonId: '00000000-0000-4000-8000-000000000000', referenceId: p.reference_id,
    price: p.price, size: p.size, purchaseUrl: p.purchase_url, imageUrl: p.image_url, imageSource: p.image_source,
    enabled: p.enabled, available: p.available }).success;
}
export function selectInventory<T extends InventoryProduct>(products: T[], references: ProductReference[], answers: HairAnswers) {
  const candidates = products.flatMap(p => {
    const r = references.find(r => r.id === p.reference_id);
    if (!p.verified || !p.active || !p.enabled || !p.available || !completeInventory(p) || !r?.verified || r.kind !== 'product') return [];
    if (!['Shampoo', 'Conditioner', 'Mask', 'Leave-in'].includes(p.function) || r.category !== p.function) return [];
    const parsed = suitabilitySchema.safeParse(r.suitability);
    if (!parsed.success) return [];
    const s = parsed.data;
    // Scalp compatibility must be explicitly verified; never infer sensitive-scalp suitability.
    if (!s.scalps.includes(answers.scalp)) return [];
    const checks: [string[], string][] = [[s.colors, answers.color], [s.textures, answers.texture], [s.thicknesses, answers.thickness], [s.heat, answers.heat]];
    if (checks.some(([allowed, value]) => allowed.length > 0 && !allowed.includes(value))) return [];
    const concern = s.concerns.includes(answers.concern), goal = s.goals.includes(answers.goal);
    if (!concern && !goal) return [];
    if (p.function === 'Mask' && !['Dryness', 'Breakage', 'Frizz'].includes(answers.concern)) return [];
    if (p.function === 'Leave-in' && answers.heat === 'Never' && !['Dryness', 'Frizz'].includes(answers.concern) && answers.goal !== 'Defined curls') return [];
    const reasons = [...(concern ? ['Matches your main hair concern.'] : []), ...(goal ? ['Matches your hair goal.'] : []), ...(s.colors.length ? ['Compatible with your reported color treatment.'] : []), ...(s.textures.length ? ['Matches your hair texture.'] : [])];
    const score = Number(concern) * 100 + Number(goal) * 30 + Number(s.colors.includes(answers.color)) * 10 + Number(s.textures.includes(answers.texture)) * 5 + Number(s.thicknesses.includes(answers.thickness)) * 3;
    return [{ ...p, reasons, score }];
  });
  candidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const selected = new Map<string, T & { reasons: string[]; score: number }>();
  for (const p of candidates) if (!selected.has(p.function)) selected.set(p.function, p);
  return [...selected.values()].slice(0, MAX_RECOMMENDED_PRODUCTS).map(({ score: _score, ...p }) => p);
}