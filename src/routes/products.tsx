import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { SlidersHorizontal, Heart, Columns2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductInfo } from '@/components/products/ProductInfo';
import { catalogQuery } from '@/lib/products/queries';
import { useProductPreferences } from '@/lib/products/preferences';
import { categoryNames, categoryName, recordedSpf, rankCatalog } from '@/lib/products/catalog';

const defaults = { view: 'recommended', q: '', category: '', skin: '', concern: '', brand: '', min: '', max: '', fragrance: false, spf: '', coverage: '', finish: '', sort: 'match', favorites: false, page: 1 };
export const Route = createFileRoute('/products')({
  validateSearch: (s: Record<string, unknown>) => ({
    view: typeof s.view === 'string' ? s.view : defaults.view, q: typeof s.q === 'string' ? s.q : '', category: typeof s.category === 'string' ? s.category : '', skin: typeof s.skin === 'string' ? s.skin : '', concern: typeof s.concern === 'string' ? s.concern : '', brand: typeof s.brand === 'string' ? s.brand : '', min: typeof s.min === 'string' ? s.min : '', max: typeof s.max === 'string' ? s.max : '', fragrance: s.fragrance === true, spf: typeof s.spf === 'string' ? s.spf : '', coverage: typeof s.coverage === 'string' ? s.coverage : '', finish: typeof s.finish === 'string' ? s.finish : '', sort: typeof s.sort === 'string' ? s.sort : 'match', favorites: s.favorites === true, page: typeof s.page === 'number' && Number.isFinite(s.page) ? s.page : 1,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  head: () => ({ meta: [{ title: 'Personalized Product Library — Rose AI' }, { name: 'description', content: 'Explore verified skincare, sunscreen and makeup, with personal matches, favorites and comparisons.' }, { property: 'og:title', content: 'Personalized Product Library — Rose AI' }, { property: 'og:description', content: 'Browse all verified skin products and compare their recorded benefits and ingredients.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  errorComponent: CatalogError,
  notFoundComponent: () => <p>No products found.</p>,
  component: ProductLibrary,
});
function CatalogError() { const router = useRouter(); return <div role="alert"><p>Could not load products. Please try again.</p><Button className="mt-3" onClick={() => router.invalidate()}>Try again</Button></div>; }
function ProductLibrary() {
  const { data: products } = useSuspenseQuery(catalogQuery);
  const { preferences, favorites, toggleFavorite } = useProductPreferences();
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  const [open, setOpen] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  function update(patch: Partial<typeof defaults>) { void navigate({ search: prev => ({ ...prev, ...patch, page: patch.page ?? 1 }), replace: true }); }
  const options = (key: 'brand' | 'coverage' | 'finish') => [...new Set(products.map(p => p[key]).filter(Boolean))].sort();
  const ranked = filters.view === 'all' ? [...products] : rankCatalog(products, preferences);
  const found = ranked.filter(p => {
    const skinText = `${p.best_for} ${p.concerns.join(' ')}`.toLowerCase();
    const skin = filters.skin === 'dry' ? 'dry' : filters.skin;
    const concern = ({ rosacea: 'redness', acne: 'acne', irritation: 'sensitive', 'fine lines': 'lines' } as Record<string, string>)[filters.concern] ?? filters.concern;
    return (!filters.q || `${p.brand} ${p.name}`.toLowerCase().includes(filters.q.toLowerCase())) && (!filters.category || categoryName(p) === filters.category) && (!skin || skinText.includes(skin)) && (!concern || p.concerns.includes(concern) || (filters.concern === 'acne' && /blemish|acne|bump/i.test(skinText))) && (!filters.brand || p.brand === filters.brand) && (!filters.fragrance || p.fragrance_free === true) && (!filters.min || (p.approx_price !== null && p.approx_price >= Number(filters.min))) && (!filters.max || (p.approx_price !== null && p.approx_price <= Number(filters.max))) && (!filters.spf || (recordedSpf(p) ?? 0) >= Number(filters.spf)) && (!filters.coverage || p.coverage === filters.coverage) && (!filters.finish || p.finish === filters.finish) && (!filters.favorites || favorites.includes(p.id));
  });
  if (filters.sort === 'price') found.sort((a, b) => (a.approx_price ?? Infinity) - (b.approx_price ?? Infinity));
  else if (filters.sort === 'brand' || (filters.view === 'all' && filters.sort === 'match')) found.sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
  else if (filters.sort === 'category') found.sort((a, b) => categoryName(a).localeCompare(categoryName(b)) || a.brand.localeCompare(b.brand));
  const pages = Math.max(1, Math.ceil(found.length / 12));
  const page = Math.max(1, Math.min(pages, Math.floor(filters.page)));
  const showing = found.slice((page - 1) * 12, page * 12);
  function select(label: string, key: 'category' | 'skin' | 'concern' | 'brand' | 'coverage' | 'finish' | 'spf' | 'sort', values: string[]) {
    return <label className="block text-xs font-semibold text-foreground">{label}<select aria-label={label} value={filters[key]} onChange={e => update({ [key]: e.target.value })} className="mt-1 w-full min-w-0 rounded-md border border-border bg-card px-2 py-2.5 text-sm text-foreground"><option value="">Any</option>{values.map(value => <option key={value} value={value}>{value}</option>)}</select></label>;
  }
  return <div className="space-y-5 pb-6">
    <header><p className="eyebrow">Rose AI</p><h1 className="mt-2 font-display text-3xl leading-tight text-foreground">Personalized Product Library</h1></header>
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Product views">
      <Button className="h-auto whitespace-normal py-3" variant={filters.view !== 'all' ? 'default' : 'outline'} onClick={() => update({ view: 'recommended', sort: 'match' })}>Recommended for You</Button>
      <Button className="h-auto whitespace-normal py-3" variant={filters.view === 'all' ? 'default' : 'outline'} onClick={() => update({ view: 'all', sort: 'brand' })}>All Products</Button>
    </div>
    {preferences.urgent && <p className="text-sm text-destructive">Please see a professional first. Browsing is not a treatment recommendation.</p>}
    {!preferences.tags.length && filters.view !== 'all' && <p className="text-xs text-muted-foreground">No saved preferences yet. All verified products are available.</p>}
    <input aria-label="Search products" placeholder="Search products" value={filters.q} onChange={e => update({ q: e.target.value })} className="w-full rounded-md border border-border bg-card px-3 py-3 text-base text-foreground" />
    <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setOpen(!open)} aria-expanded={open}><SlidersHorizontal />Filters</Button><Button variant={filters.favorites ? 'default' : 'outline'} onClick={() => update({ favorites: !filters.favorites })}><Heart />Favorites</Button><Button variant="ghost" onClick={() => update(defaults)}>Clear filters</Button></div>
    {open && <div className="grid grid-cols-2 gap-3 border-y border-border py-4">
      {select('Category', 'category', categoryNames)}{select('Skin type', 'skin', ['dry', 'oily', 'combination', 'sensitive'])}{select('Skin concern', 'concern', ['redness', 'rosacea', 'dryness', 'acne', 'irritation', 'fine lines'])}{select('Brand', 'brand', options('brand'))}
      {['min', 'max'].map(key => <label key={key} className="text-xs font-semibold text-foreground">{key === 'min' ? 'Minimum price (USD)' : 'Maximum price (USD)'}<input aria-label={key === 'min' ? 'Minimum price (USD)' : 'Maximum price (USD)'} type="number" min="0" value={key === 'min' ? filters.min : filters.max} onChange={e => update({ [key]: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-card p-2 text-sm" /></label>)}
      {select('SPF level', 'spf', ['15', '30', '50'])}{select('Coverage', 'coverage', options('coverage'))}{select('Finish', 'finish', options('finish'))}
      <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={filters.fragrance} onChange={e => update({ fragrance: e.target.checked })} />Fragrance-free</label>
      <p className="col-span-2 text-xs leading-relaxed text-muted-foreground">Filters use recorded product information only. Missing prices, SPF or suitability data are not inferred.</p>
    </div>}
    <div className="flex items-end justify-between gap-4"><p className="text-xs text-muted-foreground" role="status">{found.length} / {products.length} <span>verified products</span></p><label className="text-xs text-foreground">Sort by<select aria-label="Sort by" value={filters.sort} onChange={e => update({ sort: e.target.value })} className="ml-2 rounded-md border border-border bg-card p-2"><option value="match">Best match</option><option value="price">Price</option><option value="brand">Brand</option><option value="category">Category</option></select></label></div>
    {compare.length > 0 && <div className="flex items-center gap-2 border-y border-border py-3"><Button disabled={compare.length < 2} onClick={() => setComparing(true)}><Columns2 />Compare ({compare.length})</Button><Button variant="ghost" onClick={() => setCompare([])}>Clear comparison</Button></div>}
    {!found.length && <p className="py-8 text-center text-muted-foreground">No products match these filters.</p>}
    <div className="grid gap-4">{showing.map(p => <article key={p.id} className="rounded-lg border border-border bg-card p-5"><ProductInfo product={p} preferences={preferences} favorite={favorites.includes(p.id)} onFavorite={() => toggleFavorite(p.id)} /><label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><input aria-label={`Compare ${p.brand} ${p.name}`} type="checkbox" checked={compare.includes(p.id)} disabled={!compare.includes(p.id) && compare.length >= 3} onChange={() => setCompare(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])} />Compare</label></article>)}</div>
    <div className="flex items-center justify-between gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>Previous</Button><span className="text-xs text-muted-foreground">{page} / {pages}</span><Button variant="outline" disabled={page >= pages} onClick={() => update({ page: page + 1 })}>Next</Button></div>
    <p className="text-xs text-muted-foreground">Favorites are saved on this device. Prices are approximate USD amounts; check the retailer for current pricing.</p>
    {comparing && <div role="dialog" aria-modal="true" aria-label="Compare products" className="fixed inset-0 z-50 overflow-auto bg-background p-4"><div className="mx-auto max-w-5xl"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-2xl text-foreground">Compare products</h2><Button aria-label="Close comparison" title="Close comparison" variant="outline" size="icon" onClick={() => setComparing(false)}><X /></Button></div><div className="overflow-x-auto"><div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-5">{products.filter(p => compare.includes(p.id)).map(p => <article key={p.id} className="border-r border-border pr-4"><ProductInfo product={p} preferences={preferences} favorite={favorites.includes(p.id)} onFavorite={() => toggleFavorite(p.id)} detailed /></article>)}</div></div></div></div>}
  </div>;
}