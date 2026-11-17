import { Link } from '@tanstack/react-router';
import { Heart, ExternalLink, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categoryName, cautions, matchingReasons, recordedSpf, safeProductUrl, type CatalogProduct, type Preferences } from '@/lib/products/catalog';

export function ProductInfo({ product: p, preferences, favorite, onFavorite, detailed = false }: { product: CatalogProduct; preferences: Preferences; favorite: boolean; onFavorite: () => void; detailed?: boolean }) {
  const reasons = matchingReasons(p, preferences);
  const warnings = cautions(p, preferences);
  const image = safeProductUrl(p.image_url);
  const url = safeProductUrl(p.normal_url);
  return <>
    <div className="flex items-start gap-3">
      {image && <img src={image} alt={`${p.brand} ${p.name}`} className="h-20 w-20 shrink-0 rounded-md bg-card object-contain" loading="lazy" onError={e => { e.currentTarget.hidden = true; }} />}
      <div className="min-w-0 flex-1"><p className="eyebrow break-words">{p.brand}</p><h2 className="mt-1 break-words font-display text-xl leading-tight text-foreground">{p.name}</h2><p className="mt-2 text-xs text-muted-foreground">{categoryName(p)}</p></div>
      <Button variant="ghost" size="icon" aria-label={favorite ? 'Remove from Favorites' : 'Save to Favorites'} title={favorite ? 'Remove from Favorites' : 'Save to Favorites'} aria-pressed={favorite} onClick={onFavorite}><Heart className={favorite ? 'fill-primary text-primary' : 'text-muted-foreground'} /></Button>
    </div>
    <p className="mt-3 text-sm text-foreground">{p.approx_price !== null ? `≈ ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.approx_price)}` : 'Price not recorded'}</p>
    {p.purpose && <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">{p.purpose}</p>}
    {p.best_for && <p className="mt-2 text-xs text-muted-foreground">{p.best_for}</p>}
    {reasons.length > 0 && <div className="mt-4 border-l-2 border-primary pl-3"><p className="text-xs font-semibold text-primary">Why this matches</p>{reasons.map(reason => <p key={reason} className="mt-1 text-xs text-secondary-foreground">{reason}</p>)}</div>}
    {warnings.length > 0 && <div className="mt-4 text-xs leading-relaxed text-muted-foreground"><p className="font-semibold text-foreground">Suitability cautions</p>{warnings.map(warning => <p key={warning} className="mt-1">{warning}</p>)}</div>}
    {detailed && <dl className="mt-5 space-y-4 text-sm">
      <div><dt className="font-semibold text-foreground"><FlaskConical className="mr-2 inline h-4 w-4" />Key ingredients</dt><dd className="mt-1 text-muted-foreground">{p.key_ingredients.length ? p.key_ingredients.join(', ') : 'Ingredient information not recorded.'}</dd></div>
      {p.why && <div><dt className="font-semibold text-foreground">Product benefits</dt><dd className="mt-1 text-muted-foreground">{p.why}</dd></div>}
      {p.concerns.length > 0 && <div><dt className="font-semibold text-foreground">Listed skin concerns</dt><dd className="mt-1 text-muted-foreground">{p.concerns.join(', ')}</dd></div>}
      {p.coverage && <div><dt className="font-semibold text-foreground">Coverage</dt><dd className="text-muted-foreground">{p.coverage}</dd></div>}
      {p.finish && <div><dt className="font-semibold text-foreground">Finish</dt><dd className="text-muted-foreground">{p.finish}</dd></div>}
      {recordedSpf(p) !== null && <div><dt className="font-semibold text-foreground">SPF level</dt><dd className="text-muted-foreground">{recordedSpf(p)}</dd></div>}
      {p.shades.length > 0 && <div><dt className="font-semibold text-foreground">Shades</dt><dd className="text-muted-foreground">{p.shades.join(', ')}</dd></div>}
    </dl>}
    <div className="mt-4 flex flex-wrap gap-2">
      {!detailed && <Button asChild variant="outline" size="sm"><Link to="/products/$id" params={{ id: p.id }}>Product details</Link></Button>}
      {url && <Button asChild variant="link" size="sm"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink />{new URL(url).hostname.includes('google.') ? 'Find retailers' : 'Brand / retailer'}</a></Button>}
    </div>
  </>;
}