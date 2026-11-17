import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { CatalogProduct } from './catalog';

export const getCatalog = createServerFn({ method: 'GET' }).handler(async () => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'] ?? process.env['SUPABASE_ANON_KEY'];
  if (!url || !key) throw new Error('Could not load products. Please try again.');
  const db = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_')) headers.delete('Authorization');
    headers.set('apikey', key);
    return fetch(input, { ...init, headers });
  } } });
  const products: CatalogProduct[] = [];
  for (let start = 0; ; start += 100) {
    const { data, error } = await db.from('products').select('*').eq('active', true).eq('verification_status', 'verified').order('id').range(start, start + 99);
    if (error) throw new Error('Could not load products. Please try again.');
    products.push(...(data ?? []));
    if (!data || data.length < 100) break;
  }
  return products;
});