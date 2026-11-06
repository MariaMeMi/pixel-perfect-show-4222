import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Ban, UserRound } from "lucide-react";
import { getProfileByUsername, listPosts, getCommentCounts, getSessionUserId, getMyBlockedIds, type ForumPost, type ForumProfile } from "@/lib/community/queries";
import { setForumBlock } from "@/lib/community/functions";
import { PostCard } from "@/components/community/forum-ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/community/profile/$username")({
  head: () => ({
    meta: [
      { title: "Community member · Rose AI" },
      { name: "description", content: "A pseudonymous member of the Rose AI community." },
      { property: "og:title", content: "Community member · Rose AI" },
      { property: "og:description", content: "A pseudonymous member of the Rose AI community." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const [profile, setProfile] = useState<ForumProfile | null | undefined>(undefined);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await getProfileByUsername(username);
      if (cancelled) return;
      setProfile(p);
      if (!p) return;
      const uid = await getSessionUserId();
      const [{ posts: rows }, counts, blocked] = await Promise.all([
        listPosts({ authorId: p.user_id, perPage: 50 }),
        Promise.resolve<Record<string, number>>({}),
        uid ? getMyBlockedIds(uid) : new Set<string>(),
      ]);
      const commentCounts = await getCommentCounts(rows.map((r) => r.id));
      if (cancelled) return;
      setViewerId(uid);
      setPosts(rows);
      setCommentCounts({ ...counts, ...commentCounts });
      setIsBlocked(blocked.has(p.user_id));
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (profile === undefined) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  if (profile === null)
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">This member doesn't exist.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/community">Back to community</Link>
        </Button>
      </div>
    );

  const isSelf = viewerId === profile.user_id;

  return (
    <div className="space-y-5">
      <Link to="/community" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Community
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <UserRound className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-3 text-xl font-bold text-foreground">{profile.display_name}</h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        {profile.bio && <p className="mt-2 text-sm text-foreground/80">{profile.bio}</p>}
        {viewerId && !isSelf && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={async () => {
              await setForumBlock({ data: { userId: profile.user_id, block: !isBlocked } });
              setIsBlocked(!isBlocked);
            }}
          >
            <Ban className="mr-1 h-4 w-4" /> {isBlocked ? "Unblock" : "Block"}
          </Button>
        )}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Posts</h2>
        {posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} commentCount={commentCounts[p.id]} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
