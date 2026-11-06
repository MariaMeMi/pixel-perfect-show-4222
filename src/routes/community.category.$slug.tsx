import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PenLine } from "lucide-react";
import { getCategoryBySlug, getCommentCounts, getMyBlockedIds, getSessionUserId, listPosts, type ForumCategory, type ForumPost } from "@/lib/community/queries";
import { CommunityNotice, PostCard } from "@/components/community/forum-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/community/category/$slug")({
  head: () => ({
    meta: [
      { title: "Community category · Rose AI" },
      { name: "description", content: "Community discussions by topic — educational, not medical advice." },
      { property: "og:title", content: "Community category · Rose AI" },
      { property: "og:description", content: "Community discussions by topic — educational, not medical advice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CategoryFeed,
});

type Sort = "new" | "discussed";
const PER_PAGE = 20;

function CategoryFeed() {
  const { slug } = Route.useParams();
  const [category, setCategory] = useState<ForumCategory | null | undefined>(undefined);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [total, setTotal] = useState(0);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [sort, setSort] = useState<Sort>("new");
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cat = await getCategoryBySlug(slug);
      if (cancelled) return;
      setCategory(cat);
      if (!cat) return;
      const userId = await getSessionUserId();
      const blocked = userId ? await getMyBlockedIds(userId) : new Set<string>();
      const { posts: rows, total } = await listPosts({ categoryId: cat.id, page, perPage: PER_PAGE });
      const visible = rows.filter((p) => !blocked.has(p.author_id));
      const counts = await getCommentCounts(visible.map((p) => p.id));
      if (cancelled) return;
      setPosts(visible);
      setTotal(total);
      setCommentCounts(counts);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, page]);

  const sorted = useMemo(() => {
    if (sort === "new") return posts;
    return [...posts].sort((a, b) => (commentCounts[b.id] ?? 0) - (commentCounts[a.id] ?? 0));
  }, [posts, sort, commentCounts]);

  if (category === undefined) return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  if (category === null)
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">This category doesn't exist.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/community">Back to community</Link>
        </Button>
      </div>
    );

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-5">
      <div>
        <Link to="/community" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Community
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{category.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link to="/community/new">
              <PenLine className="mr-1 h-4 w-4" /> New post
            </Link>
          </Button>
        </div>
      </div>

      <CommunityNotice />

      <div className="flex gap-2 text-xs">
        {(["new", "discussed"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-medium transition-colors",
              sort === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
            )}
          >
            {s === "new" ? "Newest" : "Most discussed"}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No posts here yet — start the first discussion.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((p) => (
            <PostCard key={p.id} post={p} commentCount={commentCounts[p.id]} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
