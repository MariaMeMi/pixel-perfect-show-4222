import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Plus, Save, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { salonAdminOverview, saveSalonProduct } from '@/lib/hair/salon.functions';
import { inventorySchema } from '@/lib/hair/inventory';

type Data = Awaited<ReturnType<typeof salonAdminOverview>>;
type Product = Data['products'][number];
type Reference = Data['references'][number];
export function SalonInventory({ salonId, products, references }: { salonId: string; products: Product[]; references: Reference[] }) {
  const [view, setView] = useState('Salon Inventory');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<{ id?: string; referenceId: string; price: string; size: string; purchaseUrl: string; imageUrl: string; imageSource: string; enabled: boolean; available: boolean } | null>(null);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const save = useServerFn(saveSalonProduct); const qc = useQueryClient();
  const selected = references.find(r => r.id === draft?.referenceId);
  const add = (r: Reference) => { setDraft({ referenceId: r.id, price: '', size: '', purchaseUrl: '', imageUrl: '', imageSource: '', enabled: true, available: false }); setMessage(''); };
  const edit = (p: Product) => { setDraft({ id: p.id, referenceId: p.reference_id ?? '', price: p.price, size: p.size, purchaseUrl: p.purchase_url, imageUrl: p.image_url, imageSource: p.image_source, enabled: p.enabled, available: p.available }); setMessage(''); };
  const filtered = references.filter(r => `${r.brand} ${r.name}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2">{['Salon Inventory', 'Product Reference Catalog'].map(v => <Button key={v} variant={view === v ? 'default' : 'outline'} onClick={() => setView(v)}>{v}</Button>)}</div><Button variant="outline" onClick={() => setView('Product Reference Catalog')}><Plus/>Add from reference catalog</Button></div>
    {draft && <form className="mb-8 grid max-w-3xl gap-5 border-y border-border py-6 sm:grid-cols-2" onSubmit={async e => { e.preventDefault(); setBusy(true); setMessage(''); try { await save({ data: inventorySchema.parse({ ...draft, salonId }) }); await qc.invalidateQueries({ queryKey: ['salon-admin'] }); setDraft(null); setView('Salon Inventory'); setMessage('Inventory saved.'); } catch(e) { setMessage(e instanceof Error && e.name !== 'ZodError' ? e.message : 'Provide the price, size, secure purchase link and approved image source.'); } finally { setBusy(false); } }}>
      <h3 className="text-2xl sm:col-span-2" data-no-translate>{selected?.name}</h3>
      <label className="sm:col-span-2">Verified product reference<select aria-label="Verified product reference" required className="mt-2 block h-10 w-full rounded-md border border-input bg-background px-3" value={draft.referenceId} onChange={e => setDraft({ ...draft, referenceId: e.target.value })}><option value="">Select a verified product</option>{references.filter(r => r.verified && r.kind === 'product').map(r => <option key={r.id} value={r.id} data-no-translate>{r.brand} · {r.name}</option>)}</select></label>
      {([['price','Actual retail price'],['size','Product size'],['purchaseUrl','Product purchase URL'],['imageUrl','Product image URL'],['imageSource','Approved image source']] as const).map(([key, label]) => <label key={key}>{label}<Input required maxLength={key === 'price' ? 60 : key === 'size' ? 80 : key === 'imageSource' ? 600 : 1000} type={key.endsWith('Url') ? 'url' : 'text'} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })}/></label>)}
      <label className="flex items-center gap-3"><input type="checkbox" checked={draft.enabled} onChange={e => setDraft({ ...draft, enabled: e.target.checked })}/>Enabled in salon inventory</label>
      <label className="flex items-center gap-3"><input type="checkbox" checked={draft.available} onChange={e => setDraft({ ...draft, available: e.target.checked })}/>In stock</label>
      <label className="flex items-start gap-3 sm:col-span-2"><input type="checkbox" required/>I confirm the retail details are accurate and the image is approved for use.</label>
      <div className="flex gap-3 sm:col-span-2"><Button disabled={busy} type="submit"><Save/>Save inventory</Button><Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button></div>
    </form>}
    {message && <p role="status" className="mb-5">{message}</p>}
    {view === 'Product Reference Catalog' ? <><label className="mb-6 block max-w-md">Search reference catalog<Input value={search} onChange={e => setSearch(e.target.value)}/></label><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(r => <article key={r.id} className="rounded-lg border border-border bg-card p-5"><p className="text-xs text-primary" data-no-translate>{r.brand}</p><h3 className="my-3 text-xl" data-no-translate>{r.name}</h3><p>{r.intended_use}</p><p className="mt-3 text-sm text-muted-foreground">{r.kind === 'collection' ? 'Collection · not purchasable' : r.verified ? 'Verified individual product' : 'Awaiting manufacturer verification'}</p>{r.description && <p className="mt-3 text-sm">{r.description}</p>}{r.source_url && <a className="mt-3 flex items-center gap-2 text-sm text-primary underline" href={r.source_url} target="_blank" rel="noopener noreferrer">Manufacturer source <ExternalLink size={14}/></a>}{r.kind === 'product' && r.verified && <Button className="mt-4" variant="outline" onClick={() => add(r)}><Plus/>Add to inventory</Button>}</article>)}</div></> : <><h3 className="mb-5 text-2xl">Salon Inventory</h3><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{products.map(p => <article key={p.id} className="rounded-lg border border-border bg-card p-5">{p.image_url && <img src={p.image_url} alt={p.name} className="mb-4 aspect-square w-full object-contain"/>}<p data-no-translate className="text-xs text-primary">{p.brand}</p><h3 data-no-translate className="my-3 text-xl">{p.name}</h3><p>{p.function}</p><p data-no-translate className="my-3">{p.price} · {p.size}</p><p className="text-sm text-muted-foreground">{p.enabled ? 'Enabled' : 'Disabled'} · {p.available ? 'In stock' : 'Out of stock'}</p><Button variant="outline" className="mt-4" onClick={() => edit(p)}>Edit inventory</Button></article>)}</div>{!products.length && <p className="py-8 text-muted-foreground">No inventory yet. Add a verified individual product and its real retail details.</p>}</>}
  </>;
}