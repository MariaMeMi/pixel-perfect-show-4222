import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MessageSquare, PenLine, Search, Users } from "lucide-react";
import { listCategories, listPosts, getCommentCounts, getPostLikes, getMyBlockedIds, getSessionUserId, type ForumCategory, type ForumPost } from "@/lib/community/queries";
import { toggleForumReaction } from "@/lib/community/functions";
import { CommunityNotice, PostCard } from "@/components/community/forum-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      { title: "Community · Rose AI" },
      { name: "description", content: "A kind, pseudonymous community for people living with rosacea and sensitive skin. Educational, not medical advice." },
      { property: "og:title", content: "Community · Rose AI" },
      { property: "og:description", content: "Share experiences, routines and support with the Rose AI community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityHome,
});

function CommunityHome() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const userId = await getSessionUserId();
      const [cats, blocked] = await Promise.all([listCategories(), userId ? getMyBlockedIds(userId) : new Set<string>()]);
      const { posts: recent } = await listPosts({ perPage: 20 });
      const visible = recent.filter((p) => !blocked.has(p.author_id));
      const counts = await getCommentCounts(visible.map((p) => p.id));
      const likes = await getPostLikes(visible.map((p) => p.id), userId);
      if (cancelled) return;
      setCategories(cats);
      setPosts(visible);
      setCommentCounts(counts);
      setLikeCounts(likes.counts);
      setMyLikes(likes.mine);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleLike = async (postId: string) => {
    const userId = await getSessionUserId();
    if (!userId) {
      navigate({ to: "/welcome" });
      return;
    }
    const wasLiked = myLikes.has(postId);
    setMyLikes((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setLikeCounts((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] ?? 0) + (wasLiked ? -1 : 1)) }));
    try {
      await toggleForumReaction({ data: { postId, kind: "heart" } });
    } catch {
      setMyLikes((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setLikeCounts((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] ?? 0) + (wasLiked ? 1 : -1)) }));
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q));
  }, [posts, search]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Users className="h-6 w-6 text-primary" /> Community
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Share experiences and support — pseudonymously.</p>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link to="/community/new">
            <PenLine className="mr-1 h-4 w-4" /> New post
          </Link>
        </Button>
      </header>

      <CommunityNotice />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search discussions…" className="pl-9" />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Categories</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/community/category/$slug"
              params={{ slug: c.slug }}
              className="rounded-2xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
            >
              <p className="text-sm font-semibold text-foreground">{c.name}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <MessageSquare className="h-4 w-4" /> Recent discussions
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {search ? "No discussions match your search." : "No discussions yet — be the first to start one."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                commentCount={commentCounts[p.id]}
                likeCount={likeCounts[p.id]}
                liked={myLikes.has(p.id)}
                onToggleLike={() => toggleLike(p.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
