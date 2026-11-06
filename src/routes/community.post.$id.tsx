import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Ban, Pencil, Trash2 } from "lucide-react";
import { getPost, listComments, getReactions, getMyBlockedIds, getSessionUserId, type ForumComment, type ForumPost } from "@/lib/community/queries";
import { addForumComment, deleteForumComment, deleteForumPost, setForumBlock, toggleForumReaction } from "@/lib/community/functions";
import { CommunityNotice, ReactionBar, ReportButton, RequireSignIn, SignedImage, timeAgo } from "@/components/community/forum-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ReactionKind } from "@/lib/community/rules";

export const Route = createFileRoute("/community/post/$id")({
  head: () => ({
    meta: [
      { title: "Discussion · Rose AI Community" },
      { name: "description", content: "A community discussion on Rose AI — educational, not medical advice." },
      { property: "og:title", content: "Discussion · Rose AI Community" },
      { property: "og:description", content: "A community discussion on Rose AI — educational, not medical advice." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<ForumPost | null | undefined>(undefined);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const uid = await getSessionUserId();
    const [p, c, r, b] = await Promise.all([
      getPost(id),
      listComments(id),
      getReactions(id, uid),
      uid ? getMyBlockedIds(uid) : new Set<string>(),
    ]);
    setUserId(uid);
    setPost(p);
    setComments(c);
    setCounts(r.counts);
    setMine(r.mine);
    setBlocked(b);
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (post === undefined) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  if (post === null || post.status === "hidden")
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {post?.status === "hidden" ? "This post was removed by moderators." : "This post doesn't exist or was deleted."}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/community">Back to community</Link>
        </Button>
      </div>
    );

  const author = post.community_profiles;
  const isOwn = userId === post.author_id;
  const authorBlocked = blocked.has(post.author_id);

  const toggle = async (kind: ReactionKind, target: { postId?: string; commentId?: string }) => {
    if (!userId) return;
    try {
      await toggleForumReaction({ data: { ...target, kind } });
      await reload();
    } catch {
      /* rate limited or offline — leave UI as-is */
    }
  };

  const submitComment = async () => {
    if (!draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      await addForumComment({ data: { postId: id, parentId: replyTo ?? undefined, body: draft } });
      setDraft("");
      setReplyTo(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error && e.message === "rate_limited" ? "You're posting too quickly — please wait a little." : "Couldn't post your comment. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const removePost = async () => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    await deleteForumPost({ data: { id: post.id } });
    navigate({ to: "/community" });
  };

  const visibleComments = comments.filter((c) => !blocked.has(c.author_id));
  const topLevel = visibleComments.filter((c) => !c.parent_id);
  const repliesFor = (cid: string) => visibleComments.filter((c) => c.parent_id === cid);

  return (
    <div className="space-y-5">
      <Link
        to={post.forum_categories ? "/community/category/$slug" : "/community"}
        params={post.forum_categories ? { slug: post.forum_categories.slug } : undefined}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {post.forum_categories?.name ?? "Community"}
      </Link>

      <article className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h1 className="text-xl font-bold leading-snug text-foreground">{post.title}</h1>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {author ? (
            <Link to="/community/profile/$username" params={{ username: author.username }} className="font-medium text-foreground/80 hover:text-primary">
              {author.display_name} · @{author.username}
            </Link>
          ) : (
            <span>Community member</span>
          )}
          <span>{timeAgo(post.created_at)}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{post.body}</p>
        {post.image_path && <SignedImage path={post.image_path} alt="Photo shared with this post" />}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <ReactionBar targetKey={`post:${post.id}`} counts={counts} mine={mine} disabled={!userId} onToggle={(kind) => toggle(kind, { postId: post.id })} />
          <div className="flex items-center gap-3">
            {isOwn && (
              <>
                <Link to="/community/edit/$id" params={{ id: post.id }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <button type="button" onClick={removePost} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </>
            )}
            {!isOwn && <ReportButton postId={post.id} signedIn={Boolean(userId)} />}
          </div>
        </div>
        {!isOwn && userId && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={async () => {
                await setForumBlock({ data: { userId: post.author_id, block: !authorBlocked } });
                await reload();
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Ban className="h-3.5 w-3.5" /> {authorBlocked ? "Unblock this member" : "Block this member"}
            </button>
          </div>
        )}
      </article>

      <CommunityNotice />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Comments · {visibleComments.filter((c) => c.status === "visible").length}
        </h2>
        {topLevel.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            No comments yet — share your experience.
          </p>
        )}
        {topLevel.map((c) => (
          <CommentCard
            key={c.id}
            comment={c}
            replies={repliesFor(c.id)}
            userId={userId}
            counts={counts}
            mine={mine}
            onReply={() => setReplyTo(c.id)}
            onToggle={(kind, commentId) => toggle(kind, { commentId })}
            onDelete={async (commentId) => {
              await deleteForumComment({ data: { id: commentId } });
              await reload();
            }}
          />
        ))}
      </section>

      <RequireSignIn>
        {() => (
          <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
            {replyTo && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Replying to a comment</span>
                <button type="button" onClick={() => setReplyTo(null)} className="text-primary">
                  Cancel reply
                </button>
              </div>
            )}
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a kind, helpful comment…" rows={3} maxLength={2000} />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={submitComment} disabled={sending || !draft.trim()} className="w-full">
              {sending ? "Posting…" : "Post comment"}
            </Button>
          </div>
        )}
      </RequireSignIn>
    </div>
  );
}

function CommentCard({
  comment,
  replies,
  userId,
  counts,
  mine,
  onReply,
  onToggle,
  onDelete,
}: {
  comment: ForumComment;
  replies: ForumComment[];
  userId: string | null;
  counts: Record<string, number>;
  mine: Set<string>;
  onReply: () => void;
  onToggle: (kind: ReactionKind, commentId: string) => void;
  onDelete: (commentId: string) => void;
}) {
  if (comment.status === "hidden")
    return <p className="rounded-2xl border border-border bg-muted/40 p-4 text-xs italic text-muted-foreground">This comment was removed by moderators.</p>;
  const author = comment.community_profiles;
  const isOwn = userId === comment.author_id;
  return (
    <div className="space-y-2">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {author ? (
            <Link to="/community/profile/$username" params={{ username: author.username }} className="font-medium text-foreground/80 hover:text-primary">
              {author.display_name} · @{author.username}
            </Link>
          ) : (
            <span>Community member</span>
          )}
          <span>{timeAgo(comment.created_at)}</span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{comment.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <ReactionBar targetKey={`comment:${comment.id}`} counts={counts} mine={mine} disabled={!userId} onToggle={(kind) => onToggle(kind, comment.id)} />
          <div className="flex items-center gap-3">
            {userId && (
              <button type="button" onClick={onReply} className="text-xs text-muted-foreground hover:text-foreground">
                Reply
              </button>
            )}
            {isOwn && (
              <button type="button" onClick={() => onDelete(comment.id)} className="text-xs text-muted-foreground hover:text-destructive">
                Delete
              </button>
            )}
            {!isOwn && <ReportButton commentId={comment.id} signedIn={Boolean(userId)} />}
          </div>
        </div>
      </div>
      {replies.length > 0 && (
        <div className="ml-5 space-y-2 border-l-2 border-border pl-3">
          {replies.map((r) =>
            r.status === "hidden" ? (
              <p key={r.id} className="rounded-2xl border border-border bg-muted/40 p-3 text-xs italic text-muted-foreground">
                This reply was removed by moderators.
              </p>
            ) : (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-3.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">
                    {r.community_profiles ? `${r.community_profiles.display_name} · @${r.community_profiles.username}` : "Community member"}
                  </span>
                  <span>{timeAgo(r.created_at)}</span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/90">{r.body}</p>
                <div className="mt-2 flex items-center justify-between">
                  <ReactionBar targetKey={`comment:${r.id}`} counts={counts} mine={mine} disabled={!userId} onToggle={(kind) => onToggle(kind, r.id)} />
                  <div className="flex items-center gap-3">
                    {userId === r.author_id && (
                      <button type="button" onClick={() => onDelete(r.id)} className="text-xs text-muted-foreground hover:text-destructive">
                        Delete
                      </button>
                    )}
                    {userId !== r.author_id && <ReportButton commentId={r.id} signedIn={Boolean(userId)} />}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
