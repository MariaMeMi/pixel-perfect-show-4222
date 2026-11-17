import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductInfo } from '@/components/products/ProductInfo';
import { catalogQuery } from '@/lib/products/queries';
import { useProductPreferences } from '@/lib/products/preferences';
export const Route = createFileRoute('/products_/$id')({
  loader: async ({ context, params }) => { const rows = await context.queryClient.ensureQueryData(catalogQuery); const product = rows.find(p => p.id === params.id); if (!product) throw notFound(); return product; },
  head: ({ loaderData }) => { const title = loaderData ? `${loaderData.brand} ${loaderData.name} — Rose AI` : 'Product unavailable — Rose AI'; const description = loaderData?.purpose || 'Verified product details, recorded ingredients and suitability cautions from Rose AI.'; return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }; },
  errorComponent: () => <p role="alert">Could not load products. Please try again.</p>,
  notFoundComponent: () => <div><h1 className="font-display text-2xl">Product unavailable</h1><p className="mt-2 text-sm">This product is not in the verified public catalog.</p><Back /></div>,
  component: ProductPage,
});
function Back() { return <Button asChild variant="outline" className="mb-5 mt-3"><Link to="/products" search={{}}><ArrowLeft />All Products</Link></Button>; }
function ProductPage() { const { data: rows } = useSuspenseQuery(catalogQuery); const { id } = Route.useParams(); const product = rows.find(p => p.id === id); const { preferences, favorites, toggleFavorite } = useProductPreferences(); if (!product) return null; return <div className="pb-8"><Back /><ProductInfo product={product} preferences={preferences} favorite={favorites.includes(product.id)} onFavorite={() => toggleFavorite(product.id)} detailed /><p className="mt-6 text-xs text-muted-foreground">Product information is educational, not medical advice. Check the current ingredient list and discuss persistent irritation with a qualified professional.</p></div>; }