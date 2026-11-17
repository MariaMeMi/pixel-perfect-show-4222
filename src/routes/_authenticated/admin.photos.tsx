import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSkinPhotos } from "@/lib/skin-photos.functions";

export const Route = createFileRoute("/_authenticated/admin/photos")({
  head: () => ({
    meta: [
      { title: "Shared skin photos — Rose AI" },
      { name: "description", content: "Private review of skin-check photos users agreed to share." },
      { property: "og:title", content: "Shared skin photos — Rose AI" },
      { property: "og:description", content: "Private review of skin-check photos users agreed to share." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPhotos,
});

function AdminPhotos() {
  const fn = useServerFn(listSkinPhotos);
  const q = useQuery({ queryKey: ["admin-skin-photos"], queryFn: () => fn() });
  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <Link to="/" className="text-sm text-muted-foreground">← Back</Link>
      <h1 className="mt-3 font-display text-3xl text-foreground">Shared skin photos</h1>
      <p className="mt-2 text-sm text-muted-foreground">Only photos from people who ticked the consent box. Links expire after 10 minutes.</p>
      {q.isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
      {q.error && <p className="mt-6 text-sm text-destructive">Could not load photos.</p>}
      {q.data && !q.data.allowed && <p className="mt-6 text-sm text-muted-foreground">This page is only available to the app owner.</p>}
      {q.data?.allowed && q.data.photos.length === 0 && <p className="mt-6 text-sm text-muted-foreground">No shared photos yet.</p>}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {q.data?.photos.map((p) => (
          <figure key={p.id} className="surface overflow-hidden">
            <img src={p.url} alt="Shared skin-check photo" className="aspect-[3/4] w-full object-cover" loading="lazy" />
            <figcaption className="space-y-1 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">{p.score != null ? `Score ${p.score}/100` : "No score"} · {p.lang.toUpperCase()}</p>
              <p>{new Date(p.createdAt).toLocaleString()} · {p.signedIn ? "account" : "guest"}</p>
              {p.summary && <p className="line-clamp-3">{p.summary}</p>}
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
